// Get all renderable elements that match the expression
const getCanRenderEles = (root, expr) => {
  let arr = Array.from(root.querySelectorAll(expr));
  if (root instanceof Element && meetsEle(root, expr)) {
    arr.push(root);
  }
  return arr;
};

// Remove the original element and add a positioning element
const postionNode = (e) => {
  let marker = new Comment("x-marker");

  let parent = e.parentNode;
  parent.insertBefore(marker, e);
  parent.removeChild(e);

  return {
    marker,
    parent,
  };
};

// Converting expressions to functions
const exprToFunc = (expr) => {
  return new Function(
    "...$args",
    `
const [$e,$target] = $args;

try{
    with(this){
        ${expr};
    }
}catch(e){
    throw {
        message:e.message || "run error",
        expr:\`${expr.replace(/`/g, "\\`")}\`,
        target:this,
        error:e
    };
}`
  );
};

// Clear the expression property and add the data to the element object
const moveAttrExpr = (ele, exprName, propData) => {
  ele.removeAttribute(exprName);

  let renderedData = ele.__renderData;
  if (!renderedData) {
    renderedData = ele.__renderData = {};

    // Adding rendered data
    ele.setAttribute("x-rendered", "");
  }

  renderedData[exprName] = propData;
};

// Binding function listener, added to the record array
const bindWatch = (data, func, bindings) => {
  let eid = data.watchTick(func);
  bindings.push({
    eid,
    target: data,
  });
};

// Get the target data get function
const renderXdataGetFunc = (expr, xdata) => {
  let runFunc;

  if (regIsFuncExpr.test(expr)) {
    runFunc = exprToFunc("return " + expr).bind(xdata);
  } else {
    runFunc = () => getXData(xdata, expr);
  }

  return runFunc;
};

// Watch function binding on the renderer
// 'expr' is used as the basis for determining xdata or host, not for execution
const renderInWatch = ({ xdata, host, expr, watchFun }) => {
  const bindings = [];

  // if (host !== xdata) {
  if (!(xdata instanceof XEle)) {
    // Refill rendering within fill
    // xdata is responsible for listening to $index
    // xdata.$data is the item data itself
    // $host is the component data
    if (expr.includes("$host")) {
      if (expr.includes("$index")) {
        bindWatch(xdata, watchFun, bindings);
      }
      bindWatch(host, watchFun, bindings);
    } else if (expr.includes("$index") || expr.includes("$item")) {
      bindWatch(xdata, watchFun, bindings);
      isxdata(xdata.$data) && bindWatch(xdata.$data, watchFun, bindings);
    } else if (expr.includes("$data")) {
      isxdata(xdata.$data) && bindWatch(xdata.$data, watchFun, bindings);
    }
    // else {
    //     throw {
    //         desc: "fill element must use $data $host $item or $index",
    //         target: host,
    //         expr
    //     };
    // }
  } else {
    // host data binding
    bindWatch(xdata, watchFun, bindings);
  }

  return bindings;
};

// Expression to value setting
const exprToSet = ({ xdata, host, expr, callback, isArray }) => {
  // Instant-running judgment functions
  let runFunc = renderXdataGetFunc(expr, xdata);

  // Backing up data for comparison
  let backup_val, backup_ids, backup_objstr;

  // Rendering functions that run directly
  const watchFun = (modifys) => {
    const val = runFunc();

    if (isxdata(val)) {
      if (isArray) {
        // If it is an array, only listen to the array changes
        let ids = val.map((e) => (e && e.xid ? e.xid : e)).join(",");
        if (backup_ids !== ids) {
          callback({ val, modifys });
          backup_ids = ids;
        }
      } else {
        // Object Listening
        let obj_str = val.toJSON();

        if (backup_val !== val || obj_str !== backup_objstr) {
          callback({ val, modifys });
          backup_objstr = obj_str;
        }
      }
    } else if (backup_val !== val) {
      callback({ val, modifys });
      backup_objstr = null;
    }
    backup_val = val;
  };

  // First execute once
  watchFun();

  return renderInWatch({
    xdata,
    host,
    expr,
    watchFun,
  });
};

// Add listening data
const addBindingData = (target, bindings) => {
  let _binds = target.__bindings || (target.__bindings = []);
  _binds.push(...bindings);
};

const regIsFuncExpr = /[\(\)\;\=\>\<\|\!\?\+\-\*\/\&\|\{\}`]/;

// Element depth loop function
const elementDeepEach = (ele, callback) => {
  Array.from(ele.childNodes).forEach((target) => {
    callback(target);

    if (target instanceof Element) {
      elementDeepEach(target, callback);
    }
  });
};

// Remove data binding relationships based on if statements
const removeElementBind = (target) => {
  elementDeepEach(target, (ele) => {
    if (ele.isCustom) {
      createXEle(ele).revoke();
    }

    if (ele.__bindings) {
      ele.__bindings.forEach((e) => {
        let { target, eid } = e;
        target.unwatch(eid);
      });
    }
  });
};

// Adding elements inside a rendered template item
const addTempItemEle = ({ temp, temps, marker, parent, host, xdata }) => {
  // add elements
  let targets = parseStringToDom(temp.innerHTML);
  targets.forEach((ele) => {
    parent.insertBefore(ele, marker);
    renderTemp({ host, xdata, content: ele, temps });
  });
  return targets;
};

// Delete the elements inside the rendered template item
const removeTempItemEle = (arr) => {
  arr.forEach((item) => {
    // Removing data binding
    removeElementBind(item);

    item.parentNode.removeChild(item);
  });
};

// Logic for rendering components
// host :body component element; holds the body of the method
// xdata: rendering target data; host in single-level rendering, concrete data in x-fill mode
// content: rendering target element
const renderTemp = ({ host, xdata, content, temps }) => {
  // Event Binding
  getCanRenderEles(content, "[x-on]").forEach((target) => {
    let eventInfo = JSON.parse(target.getAttribute("x-on"));

    let eids = [];

    const $tar = createXEle(target);

    Object.keys(eventInfo).forEach((eventName) => {
      let { name } = eventInfo[eventName];

      let eid;

      // Determine if the function
      if (regIsFuncExpr.test(name)) {
        // Function Binding
        const func = exprToFunc(name);
        eid = $tar.on(eventName, (event) => {
          func.call(xdata, event, $tar);
        });
      } else {
        // Function name binding
        eid = $tar.on(eventName, (event) => {
          const func = getXData(xdata, name);
          if (func) {
            if (isFunction(func)) {
              func.call(host, event);
            } else {
              console.error({
                target: xdata,
                host,
                name,
                value: func,
                desc: "bind value is not function",
              });
            }
          } else {
            console.error({
              target: xdata,
              host,
              name,
              desc: "no binding function",
            });
          }
        });
      }

      eids.push(eid);
    });

    moveAttrExpr(target, "x-on", eventInfo);
  });

  // Attribute Binding
  getCanRenderEles(content, "[x-attr]").forEach((ele) => {
    const attrData = JSON.parse(ele.getAttribute("x-attr"));

    moveAttrExpr(ele, "x-attr", attrData);

    Object.keys(attrData).forEach((attrName) => {
      const bindings = exprToSet({
        xdata,
        host,
        expr: attrData[attrName],
        callback: ({ val }) => {
          if (val === null || val === undefined) {
            ele.removeAttribute(attrName);
          } else {
            ele.setAttribute(attrName, val);
          }
        },
      });

      addBindingData(ele, bindings);
    });
  });

  // class binding
  getCanRenderEles(content, "[x-class]").forEach((ele) => {
    const classListData = JSON.parse(ele.getAttribute("x-class"));

    moveAttrExpr(ele, "x-class", classListData);

    Object.keys(classListData).forEach((className) => {
      const bindings = exprToSet({
        xdata,
        host,
        expr: classListData[className],
        callback: ({ val }) => {
          // ele.setAttribute(className, val);
          if (val) {
            ele.classList.add(className);
          } else {
            ele.classList.remove(className);
          }
        },
      });

      addBindingData(ele, bindings);
    });
  });

  // Property Binding
  getCanRenderEles(content, "[x-prop]").forEach((ele) => {
    const propData = JSON.parse(ele.getAttribute("x-prop"));
    const xEle = createXEle(ele);

    moveAttrExpr(ele, "x-prop", propData);

    Object.keys(propData).forEach((propName) => {
      const bindings = exprToSet({
        xdata,
        host,
        expr: propData[propName],
        callback: ({ val }) => {
          propName = attrToProp(propName);

          try {
            xEle[propName] = val;
          } catch (error) {
            throw {
              target: ele,
              host: host.ele,
              desc: `failed to set property ${propName} (:${propName} or prop:${propName}), did you want to use attr:${propName}?`,
              error,
            };
          }
        },
      });

      addBindingData(ele, bindings);
    });
  });

  // Two-way data binding
  getCanRenderEles(content, "[x-sync]").forEach((ele) => {
    const propData = JSON.parse(ele.getAttribute("x-sync"));
    const xEle = createXEle(ele);

    Object.keys(propData).forEach((propName) => {
      let hostPropName = propData[propName];
      if (regIsFuncExpr.test(hostPropName)) {
        throw {
          desc: "sync only accepts attribute names",
        };
      }

      const bindings1 = exprToSet({
        xdata,
        host,
        expr: hostPropName,
        callback: ({ val }) => {
          setXData(xEle, propName, val);
        },
      });

      const bindings2 = exprToSet({
        xdata: xEle,
        host,
        expr: propName,
        callback: ({ val }) => {
          setXData(xdata, hostPropName, val);
        },
      });

      addBindingData(ele, [...bindings1, ...bindings2]);
    });
  });

  // 文本绑定
  getCanRenderEles(content, "x-span").forEach((ele) => {
    let expr = decodeURI(ele.getAttribute("prop"));

    let { marker, parent } = postionNode(ele);

    // Changing markup elements to textNode
    const textnode = document.createTextNode("");
    parent.replaceChild(textnode, marker);

    // Data Binding
    const bindings = exprToSet({
      xdata,
      host,
      expr,
      callback: ({ val }) => {
        textnode.textContent = val;
      },
    });

    addBindingData(textnode, bindings);
  });

  // Conditional expression element rendering
  getCanRenderEles(content, "[x-cmd-if]").forEach((ele) => {
    const conditionEles = [ele];
    // Pick up the subsequent else-if and else
    let { nextElementSibling } = ele;
    while (
      nextElementSibling &&
      (nextElementSibling.hasAttribute("x-cmd-else-if") ||
        nextElementSibling.hasAttribute("x-cmd-else"))
    ) {
      nextElementSibling.parentNode.removeChild(nextElementSibling);
      conditionEles.push(nextElementSibling);
      nextElementSibling = ele.nextElementSibling;
    }

    let all_expr = "";

    // Converting concatenated conditional elements into conditional functions
    const conditions = conditionEles.map((e, index) => {
      let callback;

      const expr =
        e.getAttribute("x-cmd-else-if") || e.getAttribute("x-cmd-if");

      if (expr) {
        callback = renderXdataGetFunc(expr, xdata);
        all_expr += `${index == 0 ? "if" : "else-if"}(${expr})...`;
      }

      return {
        callback,
        tempEle: e,
      };
    });

    // Positioning text elements
    let { marker, parent } = postionNode(ele);

    // Generated target elements
    let oldTargetEle = null;
    let oldConditionId = -1;

    const watchFun = (modifys) => {
      let tempEle,
        conditionId = -1;
      let conditionVal;
      conditions.some((e, index) => {
        if (e.callback) {
          conditionVal = !!e.callback();

          if (conditionVal) {
            tempEle = e.tempEle;
            conditionId = index;
            return true;
          }
        } else {
          // The final else condition
          tempEle = e.tempEle;
          conditionId = index;
        }
      });

      // The value or serial number is different, both can enter the corrected link
      if (oldConditionId !== conditionId) {
        // Old template destruction
        if (oldTargetEle) {
          removeElementBind(oldTargetEle);

          oldTargetEle.parentNode.removeChild(oldTargetEle);
          oldTargetEle = null;
        }

        // Confirm that templates can be added
        if (tempEle) {
          // add element
          oldTargetEle = parseStringToDom(
            tempEle.content.children[0].outerHTML
          )[0];

          parent.insertBefore(oldTargetEle, marker);

          // Rerendering
          renderTemp({ host, xdata, content: oldTargetEle, temps });
        }
      }

      oldConditionId = conditionId;
    };

    // First execute once
    watchFun();

    addBindingData(
      marker,
      renderInWatch({
        xdata,
        host,
        expr: all_expr,
        watchFun,
      })
    );
  });

  // await element rendering
  getCanRenderEles(content, "[x-cmd-await]").forEach((ele) => {
    let awaitTemp = ele,
      thenTemp,
      catchTemp;
    // Pick up the subsequent else-if and else
    let { nextElementSibling } = ele;
    while (
      nextElementSibling &&
      (nextElementSibling.hasAttribute("x-cmd-then") ||
        nextElementSibling.hasAttribute("x-cmd-catch"))
    ) {
      if (nextElementSibling.hasAttribute("x-cmd-then")) {
        thenTemp = nextElementSibling;
      } else if (nextElementSibling.hasAttribute("x-cmd-catch")) {
        catchTemp = nextElementSibling;
      }
      nextElementSibling.parentNode.removeChild(nextElementSibling);
      nextElementSibling = ele.nextElementSibling;
    }

    // Add Location
    let { marker, parent } = postionNode(ele);

    let expr = ele.getAttribute("x-cmd-await");

    let beforePms, beforeTargets;
    const bindings = exprToSet({
      xdata,
      host,
      expr,
      callback: ({ val }) => {
        // 清除前面的数据
        if (beforeTargets) {
          removeTempItemEle(beforeTargets);
          beforeTargets = null;
        }

        // add elements
        beforeTargets = addTempItemEle({
          temp: awaitTemp,
          temps,
          marker,
          parent,
          host,
          xdata,
        });

        beforePms = val;

        val
          .then((e) => {
            if (beforePms !== val) {
              return;
            }
            removeTempItemEle(beforeTargets);
            beforeTargets = null;
            if (thenTemp) {
              beforeTargets = addTempItemEle({
                temp: thenTemp,
                temps,
                marker,
                parent,
                host,
                xdata: {
                  [thenTemp.getAttribute("x-cmd-then")]: e,
                  $host: host,
                },
              });
            }
          })
          .catch((err) => {
            if (beforePms !== val) {
              return;
            }
            removeTempItemEle(beforeTargets);
            beforeTargets = null;
            if (catchTemp) {
              beforeTargets = addTempItemEle({
                temp: catchTemp,
                temps,
                marker,
                parent,
                host,
                xdata: {
                  [catchTemp.getAttribute("x-cmd-catch")]: err,
                  $host: host,
                },
              });
            }
          });
      },
    });

    addBindingData(marker, bindings);
  });

  // Fill Binding
  getCanRenderEles(content, "[x-fill]").forEach((ele) => {
    const fillData = JSON.parse(ele.getAttribute("x-fill"));
    let fillKeys = ele.getAttribute("x-item");
    fillKeys && (fillKeys = JSON.parse(fillKeys));

    const container = ele;

    createXEle(container)._unupdate = 1;

    let [tempName, propName] = Object.entries(fillData)[0];

    let old_xid;

    // Remove the x-fill attribute in advance to prevent double rendering
    moveAttrExpr(ele, "x-fill", fillData);
    moveAttrExpr(ele, "x-item", fillKeys);

    const bindings = exprToSet({
      xdata,
      host,
      expr: propName,
      isArray: 1,
      callback: (d) => {
        const targetArr = d.val;

        // Get Template
        let tempData = temps.get(tempName);

        if (!tempData) {
          throw {
            target: host.ele,
            desc: `this template was not found`,
            name: tempName,
          };
        }

        if (!old_xid) {
          // Completely filled
          targetArr.forEach((data, index) => {
            const itemEle = createFillItem({
              host,
              data,
              index,
              tempData,
              temps,
            });

            if (fillKeys) {
              initKeyToItem(itemEle, fillKeys, xdata, host);
            }

            // Add to container
            container.appendChild(itemEle.ele);
          });

          old_xid = targetArr.xid;
        } else {
          const childs = Array.from(container.children);
          const oldArr = childs.map((e) => e.__fill_item.$data);

          const holder = Symbol("holder");

          const afterChilds = [];
          targetArr.forEach((e, index) => {
            let oldIndex = oldArr.indexOf(e);
            if (oldIndex === -1) {
              let newItem = createFillItem({
                host,
                data: e,
                index,
                tempData,
                temps,
              });

              if (fillKeys) {
                initKeyToItem(newItem, fillKeys, xdata, host);
              }

              afterChilds.push(newItem.ele);
            } else {
              // belongs to the element displacement
              let targetEle = childs[oldIndex];
              // update index
              targetEle.__fill_item.$index = index;
              afterChilds.push(targetEle);

              oldArr[oldIndex] = holder;
            }
          });

          // that need to be cleared of data
          const needRemoves = [];

          // Delete elements that are not in the data
          oldArr.forEach((e, i) => {
            if (e !== holder) {
              let e2 = childs[i];
              needRemoves.push(e2);
              container.removeChild(e2);
            }
          });

          // Removing data binding
          needRemoves.forEach((e) => removeElementBind(e));

          // Reconstructing arrays
          rebuildXEleArray(container, afterChilds);
        }
      },
    });

    addBindingData(ele, bindings);
  });
};

const initKeyToItem = (itemEle, fillKeys, xdata, host) => {
  let fData = itemEle.$item;
  Object.keys(fillKeys).forEach((key) => {
    let expr = fillKeys[key];

    const propName = attrToProp(key);
    let itemBindings = exprToSet({
      xdata,
      host,
      expr,
      callback: ({ val }) => {
        fData[propName] = val;
      },
    });

    addBindingData(itemEle.ele, itemBindings);
  });
};

const createFillItem = ({ host, data, index, tempData, temps }) => {
  const itemEle = createXEle(parseStringToDom(tempData.code)[0]);

  const itemData = createXData({
    get $host() {
      return host;
    },
    // $data: data,
    $index: index,
    get $data() {
      return data;
    },
    get $item() {
      // get self
      return itemData;
    },
    // get $index() {
    //     return this._index;
    // },
    // _index: index
  });

  defineProperties(itemEle, {
    $item: {
      get: () => itemData,
    },
    $data: {
      get: () => data,
    },
  });

  itemEle.ele.__fill_item = itemData;

  renderTemp({ host, xdata: itemData, content: itemEle.ele, temps });

  return itemEle;
};

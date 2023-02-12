const createXEle = (ele) => {
  if (!ele) {
    return null;
  }
  return ele.__xEle__ ? ele.__xEle__ : (ele.__xEle__ = new XEle(ele));
};

// Determine if an element is eligible
const meetTemp = document.createElement("template");
const meetsEle = (ele, expr) => {
  if (!ele.tagName) {
    return false;
  }
  if (ele === expr) {
    return true;
  }
  if (ele === document) {
    return false;
  }
  meetTemp.innerHTML = `<${ele.tagName.toLowerCase()} ${Array.from(
    ele.attributes
  )
    .map((e) => e.name + '="' + e.value + '"')
    .join(" ")} />`;
  return !!meetTemp.content.querySelector(expr);
};

// Converting strings to elements
const parseStringToDom = (str) => {
  const pstTemp = document.createElement("div");
  pstTemp.innerHTML = str;
  let childs = Array.from(pstTemp.children);
  return childs.map(function (e) {
    pstTemp.removeChild(e);
    return e;
  });
};

// Converting objects to elements
const parseDataToDom = (objData) => {
  if (!objData.tag) {
    console.error("this data need tag =>", objData);
    throw "";
  }

  let ele = document.createElement(objData.tag);

  // add data
  objData.class && ele.setAttribute("class", objData.class);
  objData.slot && ele.setAttribute("slot", objData.slot);

  const xele = createXEle(ele);

  // merge data
  xele[CANSETKEYS].forEach((k) => {
    if (objData[k]) {
      xele[k] = objData[k];
    }
  });

  // append child elements
  let akey = 0;
  while (akey in objData) {
    let childEle = parseDataToDom(objData[akey]);
    ele.appendChild(childEle);
    akey++;
  }

  return ele;
};

//  Converts element attribute horizontal bar to case mode
const attrToProp = (key) => {
  // Determine if there is a horizontal line
  if (/\-/.test(key)) {
    key = key.replace(/\-[\D]/g, (letter) => letter.substr(1).toUpperCase());
  }
  return key;
};
const propToAttr = (key) => {
  if (/[A-Z]/.test(key)) {
    key = key.replace(/[A-Z]/g, (letter) => "-" + letter.toLowerCase());
  }
  return key;
};

// object to get the value, optimize the string with multiple '.'
const getXData = (xdata, key) => {
  if (typeof key === "string" && key.includes(".")) {
    let tar = xdata;
    key.split(".").forEach((k) => {
      tar = tar[k];
    });
    return tar;
  } else {
    return xdata[key];
  }
};

// object to set the value, optimize the string with multiple '.'
const setXData = (xdata, key, value) => {
  if (typeof key === "string" && key.includes(".")) {
    let tar = xdata,
      tarKey = key;
    let key_arr = key.split("."),
      lastid = key_arr.length - 1;
    key_arr.forEach((k, index) => {
      if (index === lastid) {
        tarKey = k;
        return;
      }
      tar = xdata[k];
    });

    tar[tarKey] = value;
  } else {
    xdata[key] = value;
  }
};

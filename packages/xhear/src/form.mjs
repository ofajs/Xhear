const formEleNames = new Set([
  "input",
  "textarea",
  "select",
  "option",
  "button",
  "label",
  "fieldset",
  "legend",
  "form",
]);

export const initFormEle = ($ele) => {
  const { tag } = $ele;

  if (!formEleNames.has(tag)) {
    return;
  }

  switch (tag) {
    case "input":
      initInput($ele);
      break;
    case "textarea":
      initPropValue($ele, "input");
      break;
  }
};

const initPropValue = ($ele, eventType = "change") => {
  const { ele } = $ele;
  $ele.value = ele.value;
  ele.addEventListener(eventType, (e) => {
    $ele.value = ele.value;
  });
  $ele.watch((e) => {
    if (e.hasModified("value")) {
      ele.value = $ele.value;
    }
  });
};

const initInput = ($ele) => {
  const type = $ele.attr("type");

  switch (type) {
    case "text":
      initPropValue($ele, "input");
      break;
  }
};

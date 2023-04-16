function on(name, func, options) {
  func = this._convertExpr(options, func);
  this.ele.addEventListener(name, func);

  return this;
}

on.once = true; // The render function will only be executed once

export default { on };

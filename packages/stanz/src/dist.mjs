import stanz from "./base.mjs";

export default stanz;

if (typeof window !== "undefined") {
  window.stanz = stanz;
}

if (typeof module === "object") {
  module.exports = stanz;
}

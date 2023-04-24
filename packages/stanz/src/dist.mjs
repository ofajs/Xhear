import stanz from "./base.mjs";

export default stanz;

if (typeof global !== "undefined") {
  global.stanz = stanz;
}

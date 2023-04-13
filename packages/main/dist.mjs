import $ from "./base.mjs";

if (typeof global !== "undefined") {
  global.$ = $;
}

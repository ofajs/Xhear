import $ from "./base.mjs";

if (typeof window !== "undefined") {
  window.$ = $;
}

if (typeof module === "object") {
  module.exports = $;
}

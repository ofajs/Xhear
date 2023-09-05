import { test, expect } from "@playwright/test";

test("test replace temp", async ({ page }) => {
  await page.goto("http://localhost:3398/test/cases/230904/fill-option.html");

  await new Promise((res) => setTimeout(res, 50));

  await expect(await page.$$eval("option", (nodes) => nodes.length)).toBe(4);
  await expect(await page.$eval("#comp-val", (node) => node.textContent)).toBe(
    "t-cn"
  );

  await page.getByRole("combobox").selectOption("cn");
  await new Promise((res) => setTimeout(res, 50));

  await expect(await page.$eval("#comp-val", (node) => node.textContent)).toBe(
    "cn"
  );

  await page.getByRole("combobox").selectOption("a");
  await new Promise((res) => setTimeout(res, 50));
  await expect(await page.$eval("#comp-val", (node) => node.textContent)).toBe(
    "a"
  );
  await expect(await page.$$eval("option", (nodes) => nodes.length)).toBe(3);


  await page.getByRole("combobox").selectOption("t-cn");
  await new Promise((res) => setTimeout(res, 50));

  await expect(await page.$eval("#comp-val", (node) => node.textContent)).toBe(
    "t-cn"
  );
  await expect(await page.$$eval("option", (nodes) => nodes.length)).toBe(4);
});

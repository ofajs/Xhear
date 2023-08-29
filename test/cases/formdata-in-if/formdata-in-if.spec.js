import { test, expect } from "@playwright/test";

test("form data in if", async ({ page }) => {
  await page.goto("http://localhost:3398/test/cases/formdata-in-if/demo.html");
  await new Promise((res) => setTimeout(res, 300));

  await expect(await page.$eval(`#target`, (node) => node.textContent)).toBe(
    `{"a":"I am A","K1":"1","K2":"2"}`
  );

  await page.getByRole("button", { name: "Count++" }).click();

  await new Promise((res) => setTimeout(res, 300));

  await expect(await page.$eval(`#target`, (node) => node.textContent)).toBe(
    `{"a":"I am A","K1":"1","K2":"2","b":"I am B"}`
  );

  await page.getByRole("button", { name: "Count++" }).click();

  await new Promise((res) => setTimeout(res, 300));

  await expect(await page.$eval(`#target`, (node) => node.textContent)).toBe(
    `{"a":"I am A","K1":"1","K2":"2"}`
  );

  await page.locator('input[name="a"]').fill("I am Aaaaa");

  await new Promise((res) => setTimeout(res, 300));

  await expect(await page.$eval(`#target`, (node) => node.textContent)).toBe(
    `{"a":"I am Aaaaa","K1":"1","K2":"2"}`
  );
});

test("form data in x-fill", async ({ page }) => {
  await page.goto("http://localhost:3398/test/cases/formdata-in-if/demo.html");
  await new Promise((res) => setTimeout(res, 300));

  await expect(await page.$eval(`#target`, (node) => node.textContent)).toBe(
    `{"a":"I am A","K1":"1","K2":"2"}`
  );

  await page.getByRole("button", { name: "AddItem" }).click();

  await new Promise((res) => setTimeout(res, 300));

  await expect(await page.$eval(`#target`, (node) => node.textContent)).toBe(
    `{"a":"I am A","K1":"1","K2":"2","K3":"3"}`
  );

  await page.getByRole("button", { name: "AddItem" }).click();
  await new Promise((res) => setTimeout(res, 300));

  await expect(await page.$eval(`#target`, (node) => node.textContent)).toBe(
    `{"a":"I am A","K1":"1","K2":"2","K3":"3","K4":"4"}`
  );

  await page.locator('input[name="K3"]').fill("I am k33333");
  await new Promise((res) => setTimeout(res, 300));

  await expect(await page.$eval(`#target`, (node) => node.textContent)).toBe(
    `{"a":"I am A","K1":"1","K2":"2","K3":"I am k33333","K4":"4"}`
  );
});

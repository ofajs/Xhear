import { test, expect } from "@playwright/test";

test("bug: x-fill in x-if", async ({ page }) => {
  await page.goto("http://localhost:3398/test/cases/230816/fill-in-if.html");
  await page.waitForTimeout(60);

  await page.getByTestId("item-0").click();
  await page.getByTestId("item-1").click();
  await page.getByTestId("other-item").click();

  expect(!!(await page.$('[data-testid="item-0-span"]'))).toBe(false);
  expect(!!(await page.$('[data-testid="item-1-span"]'))).toBe(true);

  await page.getByRole("button", { name: "switch" }).click();
  await page.waitForTimeout(60);

  expect(await page.$('[data-testid="item-0"]')).toBe(null);
  expect(await page.$('[data-testid="item-1"]')).toBe(null);
  expect(await page.$('[data-testid="other-item"]')).toBe(null);

  await page.getByRole("button", { name: "switch" }).click();
  await page.waitForTimeout(60);

  expect(!!(await page.$('[data-testid="item-0-span"]'))).toBe(true);
  expect(!!(await page.$('[data-testid="item-1-span"]'))).toBe(true);

  await page.getByTestId("other-item").click();
});

test("x-if in x-fill", async ({ page }) => {
  await page.goto("http://localhost:3398/test/cases/230816/if-in-fill.html");

  await page.waitForTimeout(60);

  expect((await page.$$("d-item")).length).toBe(4);
  expect((await page.$$("a[olink]")).length).toBe(3);

  await page.getByRole("button", { name: "Add Item" }).click();
  await page.waitForTimeout(60);

  expect((await page.$$("d-item")).length).toBe(5);
  expect((await page.$$("a[olink]")).length).toBe(4);
});

test("x-if in x-if", async ({ page }) => {
  await page.goto("http://localhost:3398/test/cases/230816/if-in-if.html");

  await page.waitForTimeout(60);

  expect((await page.getByTestId("target").textContent()).trim()).toBe(
    "length not ok - 1"
  );

  await page.getByTestId("additem").click();

  await page.waitForTimeout(60);

  expect((await page.getByTestId("target").textContent()).trim()).toBe(
    "length ok - 2"
  );

  await page.getByTestId("additem").click();

  await page.waitForTimeout(60);

  expect((await page.getByTestId("target").textContent()).trim()).toBe(
    "length ok - 3"
  );
});

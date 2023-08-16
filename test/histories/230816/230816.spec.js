import { test, expect } from "@playwright/test";

test("bug: x-fill with x-if", async ({ page }) => {
  await page.goto(
    "http://localhost:3398/test/histories/230816/fill-in-if.html"
  );
  await new Promise((res) => setTimeout(res), 100);

  await page.getByTestId("item-0").click();
  await page.getByTestId("item-1").click();
  await page.getByTestId("other-item").click();

  expect(!!(await page.$('[data-testid="item-0-span"]'))).toBe(false);
  expect(!!(await page.$('[data-testid="item-1-span"]'))).toBe(true);

  await page.getByRole("button", { name: "switch" }).click();
  await new Promise((res) => setTimeout(res), 100);

  expect(await page.$('[data-testid="item-0"]')).toBe(null);
  expect(await page.$('[data-testid="item-1"]')).toBe(null);
  expect(await page.$('[data-testid="other-item"]')).toBe(null);

  await page.getByRole("button", { name: "switch" }).click();
  await new Promise((res) => setTimeout(res), 100);

  expect(!!(await page.$('[data-testid="item-0-span"]'))).toBe(true);
  expect(!!(await page.$('[data-testid="item-1-span"]'))).toBe(true);

  await page.getByTestId("other-item").click();
});

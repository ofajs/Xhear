import { test, expect } from "@playwright/test";

test("template watch test", async ({ page }) => {
  await page.goto("http://localhost:3398/test/statics/template-watch.html");
  await page.waitForTimeout(10);

  await page.getByRole("heading", { name: "test-demo 1" }).click();
  await page.getByRole("button", { name: "Count+1" }).click();
  await page.getByRole("button", { name: "Count+1" }).click();
  await page.getByRole("heading", { name: "test-demo 3" }).click();
  await page.getByRole("button", { name: "Set SubCount 100" }).click();
  await page.getByRole("heading", { name: "test-demo 100" }).click();
  await page.getByRole("button", { name: "Count+1" }).click();
  await page.getByRole("heading", { name: "test-demo 4" }).click();
  await page.getByRole("heading", { name: `{"val":273}` }).click();
  await page.getByRole("button", { name: "obj1.val+1" }).click();
  await page.getByRole("heading", { name: `{"val":274}` }).click();

  await expect(
    await page.evaluate(() => {
      return xdata1.owner.size;
    })
  ).toBe(2);

  await page.getByRole("button", { name: "toggle sub item" }).click();
  // await page.getByRole("heading", { name: "test-demo none" }).click();
  await page.waitForTimeout(10);

  await expect(
    await page.evaluate(() => {
      return xdata1.owner.size;
    })
  ).toBe(1);

  await page.getByRole("button", { name: "toggle sub item" }).click();
  await page.getByRole("heading", { name: "test-demo 1" }).click();

  await expect(
    await page.evaluate(() => {
      return xdata1.owner.size;
    })
  ).toBe(2);
});

test("attr test", async ({ page }) => {
  await page.goto("http://localhost:3398/test/statics/attr.html");

  await expect(
    await page.evaluate(() => $("test-demo").shadow.$("h4").attr("name"))
  ).toBe("0");

  await page.getByRole("button", { name: "Set count 100" }).click();

  await expect(
    await page.evaluate(() => $("test-demo").shadow.$("h4").attr("name"))
  ).toBe("100");

  await page.getByRole("button", { name: "Set count true" }).click();

  await expect(
    await page.evaluate(() => $("test-demo").shadow.$("h4").attr("name"))
  ).toBe("");

  await page.getByRole("button", { name: "Set count false" }).click();

  await expect(
    await page.evaluate(() => $("test-demo").shadow.$("h4").attr("name"))
  ).toBe(null);
});

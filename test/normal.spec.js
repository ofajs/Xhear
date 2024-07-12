import { test, expect } from "@playwright/test";

test("template watch test", async ({ page }) => {
  await page.goto("http://localhost:3398/test/statics/template-watch.html");
  await page.getByRole("heading", { name: "test-demo 0" }).click();
  await page.getByRole("button", { name: "Count+1" }).click();
  await page.getByRole("button", { name: "Count+1" }).click();
  await page.getByRole("heading", { name: "test-demo 2" }).click();
  await page.getByRole("button", { name: "Set SubCount 100" }).click();
  await page.getByRole("heading", { name: "test-demo 100" }).click();
  await page.getByRole("button", { name: "Count+1" }).click();
  await page.getByRole("heading", { name: "test-demo 3" }).click();
});

test("attr test", async ({ page }) => {
  await page.goto("http://localhost:3398/test/statics/attr.html");

  const { _preview: data0 } = await page.waitForFunction(async () => {
    return $("test-demo").shadow.$("h4").attr("name");
  });

  await expect(data0).toBe("0");

  await page.getByRole("button", { name: "Set count 100" }).click();

  const { _preview: data1 } = await page.waitForFunction(async () => {
    return $("test-demo").shadow.$("h4").attr("name");
  });

  await expect(data1).toBe("100");

  await page.getByRole("button", { name: "Set count true" }).click();

  const { _preview: data2 } = await page.waitForFunction(async () => {
    return $("test-demo").shadow.$("h4").attr("name");
  });

  await expect(data2).toBe("");

  await page.getByRole("button", { name: "Set count false" }).click();

  const { _preview: data3 } = await page.waitForFunction(async () => {
    return $("test-demo").shadow.$("h4").attr("name");
  });

  await expect(data3).toBe("null");
});

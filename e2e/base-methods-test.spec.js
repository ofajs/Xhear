const { test, expect } = require("@playwright/test");

test("text", async ({ page }) => {
  await page.goto("http://localhost:3398/e2e/statics/base-methods-test.html");

  const result = await page.waitForFunction(async () => {
    return $("#target1").text;
  });

  await expect(result._preview).toBe("I am target");

  await page.waitForFunction(async () => {
    $("#target1").text = "change text";
  });

  await expect(page.getByTestId("target1")).toHaveText("change text");
});

test("html", async ({ page }) => {
  await page.goto("http://localhost:3398/e2e/statics/base-methods-test.html");

  const result = await page.waitForFunction(async () => {
    return $("#target1").html;
  });

  await expect(result._preview).toBe("I am target");

  await page.waitForFunction(async () => {
    $("#target1").html = "<span style='color:red;'>text 1</span> <span style='color:green;'>text 2</span>";
  });

  await expect(page.getByTestId("target1")).toHaveText("text 1 text 2");
});

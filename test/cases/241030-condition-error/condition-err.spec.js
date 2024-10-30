import { test, expect } from "@playwright/test";

test("241030-condition-error", async ({ page }) => {
  await page.goto(
    "http://localhost:3398/test/cases/241030-condition-error/test.html"
  );

  await new Promise((res) => setTimeout(res, 300));

  const hText = await page.evaluate(() =>
    $("template-demo").shadow.$("#ha").text.trim()
  );

  expect(hText).toBe("1111");
});

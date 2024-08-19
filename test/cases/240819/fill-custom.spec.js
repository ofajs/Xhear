import { test, expect } from "@playwright/test";

test("fill custom component and render html", async ({ page }) => {
  await page.goto(
    "http://localhost:3398/test/cases/240819/fill-custom-html.html"
  );

  await new Promise((res) => setTimeout(res, 300));

  let time = await page.evaluate(() => $("#diffTime").text);
  time = parseFloat(time);

  await expect(time < 1000).toBe(true);
});

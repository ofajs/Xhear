import { test, expect } from "@playwright/test";

test("Text is not rendered repeatedly", async ({ page }) => {
  await page.goto(
    "http://localhost:3398/test/cases/repeat-render-text/render-text.html"
  );

  await page.waitForFunction(async () => {
    const text_node = $("render-text").shadow.ele.childNodes[1];
    text_node.testProp = "on";
  });

  await page.getByRole("button", { name: "add" }).click();

  const { _preview: data } = await page.waitForFunction(async () => {
    return $("render-text").shadow.ele.childNodes[1].testProp;
  });

  await expect(data).toBe("on");
});

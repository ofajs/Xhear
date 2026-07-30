import { test, expect } from "@playwright/test";

test("render multiline expression", async ({ page }) => {
  await page.goto(
    "http://localhost:3398/test/cases/render-multiline-expr/demo.html"
  );

  // 跨行表达式渲染
  await expect(
    (await page.getByTestId("multiline").textContent()).trim()
  ).toBe("hello");

  // 含双引号的表达式渲染
  await expect(
    (await page.getByTestId("quote").textContent()).trim()
  ).toBe("a - hello");

  // 切换 flag 后跨行表达式重新渲染
  await page.getByRole("button", { name: "Toggle" }).click();
  await expect(
    (await page.getByTestId("multiline").textContent()).trim()
  ).toBe("default");

  // 切回
  await page.getByRole("button", { name: "Toggle" }).click();
  await expect(
    (await page.getByTestId("multiline").textContent()).trim()
  ).toBe("hello");
});

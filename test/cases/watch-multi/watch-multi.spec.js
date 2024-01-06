import { test, expect } from "@playwright/test";

test("watch multi", async ({ page }) => {
  await page.goto("http://localhost:3398/test/cases/watch-multi/demo.html");

  await new Promise((res) => setTimeout(res, 500));

  await expect(page.getByTestId("n1")).toHaveText("num1:100");
  await expect(page.getByTestId("n2")).toHaveText("num2:20");
  await expect(page.getByTestId("n3")).toHaveText("num3:3");
  await expect(page.getByTestId("target1")).toHaveText("c1and2:3");
  await expect(page.getByTestId("target2")).toHaveText("c3and2:2");
});

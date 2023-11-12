import { test, expect } from "@playwright/test";

test("condition event", async ({ page }) => {
  await page.goto("http://localhost:3398/test/cases/condition-event/demo.html");

  await expect(page.getByTestId("r1")).toHaveText("renderOneCount:0");
  await expect(page.getByTestId("c1")).toHaveText("clearOneCount:0");
  await expect(page.getByTestId("r2")).toHaveText("renderTwo:1");
  await expect(page.getByTestId("c2")).toHaveText("clearTwo:0");

  await page.getByRole("button", { name: "AddCount" }).click();

  await expect(page.getByTestId("r1")).toHaveText("renderOneCount:1");
  await expect(page.getByTestId("c1")).toHaveText("clearOneCount:0");
  await expect(page.getByTestId("r2")).toHaveText("renderTwo:1");
  await expect(page.getByTestId("c2")).toHaveText("clearTwo:1");

  await page.getByRole("button", { name: "AddCount" }).click();

  await expect(page.getByTestId("r1")).toHaveText("renderOneCount:1");
  await expect(page.getByTestId("c1")).toHaveText("clearOneCount:0");
  await expect(page.getByTestId("r2")).toHaveText("renderTwo:1");
  await expect(page.getByTestId("c2")).toHaveText("clearTwo:1");

  await page.getByRole("button", { name: "AddCount" }).click();

  await expect(page.getByTestId("r1")).toHaveText("renderOneCount:1");
  await expect(page.getByTestId("c1")).toHaveText("clearOneCount:1");
  await expect(page.getByTestId("r2")).toHaveText("renderTwo:2");
  await expect(page.getByTestId("c2")).toHaveText("clearTwo:1");

  await page.getByRole("button", { name: "AddCount" }).click();

  await expect(page.getByTestId("r1")).toHaveText("renderOneCount:2");
  await expect(page.getByTestId("c1")).toHaveText("clearOneCount:1");
  await expect(page.getByTestId("r2")).toHaveText("renderTwo:2");
  await expect(page.getByTestId("c2")).toHaveText("clearTwo:2");

});

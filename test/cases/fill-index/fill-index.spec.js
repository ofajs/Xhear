import { test, expect } from "@playwright/test";

test("fill index", async ({ page }) => {
  await page.goto(
    "http://localhost:3398/test/cases/fill-index/fill-index.html"
  );

  await new Promise((res) => setTimeout(res, 100));

  const { _preview: arrData1 } = await page.waitForFunction(async () => {
    return $("temp-demo")
      .shadow.all("[data-testid]")
      .map((e) => e.data.testid)
      .join("-");
  });

  expect(arrData1).toEqual("t1-t2-t3-t4");

  expect((await page.getByTestId("t1").textContent()).trim()).toBe(
    `index:0 - data:{"val":1}`
  );
  expect((await page.getByTestId("t4").textContent()).trim()).toBe(
    `index:3 - data:{"val":4}`
  );

  await page.getByRole("button", { name: "Delete" }).first().click();

  expect((await page.getByTestId("t2").textContent()).trim()).toBe(
    `index:0 - data:{"val":2}`
  );
  expect((await page.getByTestId("t4").textContent()).trim()).toBe(
    `index:2 - data:{"val":4}`
  );
});

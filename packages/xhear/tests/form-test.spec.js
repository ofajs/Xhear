const { test, expect } = require("@playwright/test");

test("formData", async ({ page }) => {
  await page.goto(
    "http://localhost:3398/packages/xhear/tests/statics/form-test.html"
  );

  let { _preview: data1 } = await page.waitForFunction(async () => {
    return JSON.stringify(data);
  });
  data1 = JSON.parse(data1);

  expect(data1).toEqual({
    Texter: "",
    Filer: {},
    Selector: "1",
    checker: [null],
    TA: "I am textarea",
    custom: "default value",
  });

  await page.getByLabel("text").fill("test text value");
  await page.getByLabel("file").setInputFiles("package.json"); // not work in firefox
  await page.getByRole("combobox", { name: "select" }).selectOption("3");
  await page.getByLabel("It A").check();
  await page.getByLabel("It C").check();
  await page.getByLabel("It E").check();
  await page.getByText("I am textarea").click();
  await page.getByText("I am textarea").press("Meta+a");
  await page.getByText("I am textarea").fill("change textarea value");
  await page.getByPlaceholder("custom-inputer").fill("change the value");

  await new Promise((res) => setTimeout(res, 300));

  let { _preview: data2 } = await page.waitForFunction(async () => {
    return JSON.stringify(data);
  });
  data2 = JSON.parse(data2);

  expect(data2).toEqual({
    Texter: "test text value",
    Filer: { 0: {} },
    Selector: "3",
    checker: ["A", "C"],
    radior: "E",
    TA: "change textarea value",
    custom: "change the value",
  });
});

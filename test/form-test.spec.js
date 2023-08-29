const { test, expect } = require("@playwright/test");

test("get formData", async ({ page }) => {
  await page.goto("http://localhost:3398/test/statics/form-test.html");

  let { _preview: data1 } = await page.waitForFunction(async () => {
    return JSON.stringify(data);
  });
  data1 = JSON.parse(data1);

  expect(data1).toEqual({
    Texter: "",
    Filer: {},
    Selector: "1",
    checker: [],
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

test("set formData", async ({ page }) => {
  await page.goto("http://localhost:3398/test/statics/form-test.html");

  await new Promise((res) => setTimeout(res, 50));

  await page.waitForFunction(async () => {
    return Object.assign(data, {
      Texter: "test text",
      Selector: "3",
      checker: ["A", "C"],
      TA: "change the text area",
      custom: "change custom value",
      radior: "E",
    });
  });

  await new Promise((res) => setTimeout(res, 50));

  await expect(
    await page.$eval('[data-testid="input1"]', (node) => node.value)
  ).toBe("test text");

  await expect(await page.$eval("#c-selector", (node) => node.value)).toBe("3");

  await expect(await page.$eval("#ctexteara", (node) => node.value)).toBe(
    "change the text area"
  );

  await expect(await page.$eval("#custom-ele", (node) => $(node).value)).toBe(
    "change custom value"
  );

  expect(
    await page.$$eval("[type='checkbox']", (nodes) => {
      const arr = [];

      nodes.forEach((e) => {
        arr.push({
          val: e.value,
          checked: e.checked,
        });
      });

      return arr;
    })
  ).toEqual([
    {
      val: "A",
      checked: true,
    },
    {
      val: "B",
      checked: false,
    },
    {
      val: "C",
      checked: true,
    },
  ]);

  expect(
    await page.$$eval("[type='radio']", (nodes) => {
      const arr = [];

      nodes.forEach((e) => {
        arr.push({
          val: e.value,
          checked: e.checked,
        });
      });

      return arr;
    })
  ).toEqual([
    {
      val: "D",
      checked: false,
    },
    {
      val: "E",
      checked: true,
    },
    {
      val: "F",
      checked: false,
    },
  ]);
});

test("remove form elements", async ({ page }) => {
  await page.goto("http://localhost:3398/test/statics/form-test.html");

  let { _preview: data1 } = await page.waitForFunction(async () => {
    return JSON.stringify(data);
  });
  data1 = JSON.parse(data1);

  expect(data1).toEqual({
    Texter: "",
    Filer: {},
    Selector: "1",
    checker: [],
    TA: "I am textarea",
    custom: "default value",
  });

  await page.waitForFunction(async () => {
    $("textarea").parent.remove();
  });

  await new Promise((res) => setTimeout(res, 300));

  let { _preview: data2 } = await page.waitForFunction(async () => {
    return JSON.stringify(data);
  });
  data2 = JSON.parse(data2);

  expect(data2).toEqual({
    Texter: "",
    Filer: {},
    Selector: "1",
    checker: [],
    // TA: "I am textarea",
    custom: "default value",
  });
});

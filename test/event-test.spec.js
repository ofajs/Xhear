const { test, expect } = require("@playwright/test");

const getText = async function (page, expr) {
  const logEle = await page.$("#log");
  const logText = await logEle.textContent();
  return logText;
};

test("on", async ({ page }) => {
  await page.goto("http://localhost:3398/test/statics/event-test.html");

  await page.waitForFunction(async () => {
    $("#target").on("click", func);
  });

  await page.getByTestId("target-sub").click();

  const logText1 = await getText(page, "#log");

  await expect(logText1).toBe("click1");

  await page.getByTestId("target-sub").click();

  const logText2 = await getText(page, "#log");

  await expect(logText2).toBe("click2");
});

test("off", async ({ page }) => {
  await page.goto("http://localhost:3398/test/statics/event-test.html");

  await page.waitForFunction(async () => {
    $("#target").on("click", func);
  });

  await page.getByTestId("target-sub").click();

  const logText1 = await getText(page, "#log");

  await expect(logText1).toBe("click1");

  await page.waitForFunction(async () => {
    $("#target").off("click", func);
  });

  await page.getByTestId("target-sub").click();

  const logText2 = await getText(page, "#log");

  await expect(logText2).toBe("click1");
});

test("one", async ({ page }) => {
  await page.goto("http://localhost:3398/test/statics/event-test.html");

  await page.waitForFunction(async () => {
    $("#target").one("click", func);
  });

  await page.getByTestId("target-sub").click();

  const logText1 = await getText(page, "#log");

  await expect(logText1).toBe("click1");

  await page.getByTestId("target-sub").click();

  const logText2 = await getText(page, "#log");

  await expect(logText2).toBe("click1");
});

test("emit", async ({ page }) => {
  await page.goto("http://localhost:3398/test/statics/event-test.html");

  await page.waitForFunction(async () => {
    $("#target").emit("custom-eve");
  });

  const logText1 = await getText(page, "#log");

  await expect(logText1).toBe("custom event ok");

  await page.waitForFunction(async () => {
    $("#target").emit("custom-eve", { data: 100 });
  });

  const logText2 = await getText(page, "#log");

  await expect(logText2).toBe("custom event ok100");
});

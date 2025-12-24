const { test, expect } = require("@playwright/test");

const getText = async (page, expr) => {
 await page.waitForTimeout(10);
  const text = await (await page.$(expr)).textContent();
  return text.replace(/\n/g, "").trim();
};

const getData = async (page, func) => {
  const result = await page.waitForFunction(func);
  return result._preview;
};

test.describe("register", () => {
  test.beforeEach(async ({ page }) => {
    // Go to the starting url before each test.
    await page.goto("http://localhost:3398/test/statics/register-test.html");
  });

  test("'{{text}}' and 'on'", async ({ page }) => {
    await expect(await getText(page, "#target_a")).toBe("100");
    await expect(await getText(page, "#target_b")).toBe("101");

    await page.getByRole("button", { name: "NUM++" }).click();

    await expect(await getText(page, "#target_a")).toBe("101");
    await expect(await getText(page, "#target_b")).toBe("102");

    await page.getByRole("button", { name: "Click Me add 10" }).click();

    await expect(await getText(page, "#target_a")).toBe("111");
    await expect(await getText(page, "#target_b")).toBe("112");
  });

  test("'condition'", async ({ page }) => {
    // await page.goto(
    //   "http://localhost:3398/test/statics/register-test.html"
    // );

    await expect(await getText(page, "#condition-container")).toBe(
      "I am ELSE div"
    );

    await expect(
      await getData(
        page,
        async () => $("test-ele").shadow.$("#condition-container").length
      )
    ).toBe("1");

    await page.getByRole("button", { name: "NUM++" }).click();

    await expect(await getText(page, "#condition-container")).toBe(
      "I am IF ELSE TWO div"
    );

    await expect(
      await getData(
        page,
        async () => $("test-ele").shadow.$("#condition-container").length
      )
    ).toBe("1");

    await page.getByRole("button", { name: "NUM++" }).click();

    await expect(await getText(page, "#condition-container")).toBe(
      "I am IF ELSE ONE div"
    );

    await expect(
      await getData(
        page,
        async () => $("test-ele").shadow.$("#condition-container").length
      )
    ).toBe("1");

    await page.getByRole("button", { name: "NUM++" }).click();

    await expect(await getText(page, "#condition-container")).toBe(
      "I am IF div"
    );

    await expect(
      await getData(
        page,
        async () => $("test-ele").shadow.$("#condition-container").length
      )
    ).toBe("1");
  });

  test("'fill'", async ({ page }) => {
    await page.goto("http://localhost:3398/test/statics/register-test.html");

    await page.waitForTimeout(500);

    await expect((await page.$$(".sub-item")).length).toBe(5);

    await expect(
      await getData(page, async () => $("test-ele").owner.size)
    ).toBe("6");

    await expect(
      await getData(page, async () => {
        return $("test-ele")
          .shadow.all(".sub-val")
          .map((e) => e.text)
          .join(",");
      })
    ).toBe("I am 0,I am 1,I am child 1,I am child 2,I am 2");

    await expect(
      await getData(page, async () => {
        return $("test-ele")
          .shadow.all(".host_num")
          .map((e) => e.text)
          .join(",");
      })
    ).toBe("100,100,100,100,100");

    await page.getByRole("button", { name: "NUM++" }).click();

    await expect(
      await getData(page, async () => {
        return $("test-ele")
          .shadow.all(".host_num")
          .map((e) => e.text)
          .join(",");
      })
    ).toBe("101,101,101,101,101");

    await page.waitForFunction(async () => {
      $("test-ele").arr.splice(1, 1);
    });

    await expect((await page.$$(".sub-item")).length).toBe(2);

    await expect(
      await getData(page, async () => $("test-ele").owner.size)
    ).toBe("3");

    await expect(
      await getData(page, async () => {
        return $("test-ele")
          .shadow.all(".sub-val")
          .map((e) => e.text)
          .join(",");
      })
    ).toBe("I am 0,I am 2");

    await page.waitForFunction(async () => {
      $("test-ele").arr.reverse();
    });

    await expect(
      await getData(page, async () => {
        return $("test-ele")
          .shadow.all(".sub-val")
          .map((e) => e.text)
          .join(",");
      })
    ).toBe("I am 2,I am 0");
  });

  test("sync", async ({ page }) => {
    await page.goto("http://localhost:3398/test/statics/sync-test.html");

    await expect(page.getByPlaceholder("I am i1")).toHaveValue("I am val");
    await expect(page.getByPlaceholder("I am i2")).toHaveValue("I am val");

    await page.getByPlaceholder("I am i1").fill("testval");
    await expect(page.getByPlaceholder("I am i2")).toHaveValue("testval");

    await page.getByPlaceholder("I am i2").fill("change val 2");
    await expect(page.getByPlaceholder("I am i1")).toHaveValue("change val 2");
  });

  test("attached and detached", async ({ page }) => {
    await page.goto(
      "http://localhost:3398/test/statics/component-attached-detached.html"
    );

    await page.waitForSelector(".jasmine-specs .jasmine-passed", {
      state: "visible",
      count: 2,
    });

    await expect((await page.$$(".jasmine-failed")).length).toBe(0);
  });
});

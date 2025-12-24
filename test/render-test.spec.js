const { test, expect } = require("@playwright/test");

const getText = async (page, expr) => {
  const text = await (await page.$(expr)).textContent();
  return text.replace(/\n/g, "").trim();
};

const getData = async (page, func) => {
  const result = await page.waitForFunction(func);
  return result._preview;
};

test.describe("render", () => {
  test.beforeEach(async ({ page }) => {
    // Go to the starting url before each test.
    await page.goto("http://localhost:3398/test/statics/render-test.html");
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
    await expect(await getText(page, "#condition-container")).toBe(
      "I am ELSE div"
    );

    await expect(
      await getData(page, async () => $("#condition-container").length)
    ).toBe("1");

    await page.getByRole("button", { name: "NUM++" }).click();

    await page.waitForTimeout(60);

    await expect(await getText(page, "#condition-container")).toBe(
      "I am IF ELSE TWO div"
    );

    await expect(
      await getData(page, async () => $("#condition-container").length)
    ).toBe("1");

    await page.getByRole("button", { name: "NUM++" }).click();

    await page.waitForTimeout(60);

    await expect(await getText(page, "#condition-container")).toBe(
      "I am IF ELSE ONE div"
    );

    await expect(
      await getData(page, async () => $("#condition-container").length)
    ).toBe("1");

    await page.getByRole("button", { name: "NUM++" }).click();

    await page.waitForTimeout(60);

    await expect(await getText(page, "#condition-container")).toBe(
      "I am IF div"
    );

    await expect(
      await getData(page, async () => $("#condition-container").length)
    ).toBe("1");
  });

  test("'fill'", async ({ page }) => {
    await page.waitForTimeout(500);

    await expect((await page.$$(".sub-item")).length).toBe(5);

    await expect(await getData(page, async () => data.owner.size)).toBe("5");

    await expect(
      await getData(page, async () => {
        return $.all(".sub-val")
          .map((e) => e.text)
          .join(",");
      })
    ).toBe("I am 0,I am 1,I am child 1,I am child 2,I am 2");

    await expect(
      await getData(page, async () => {
        return $.all(".host_num")
          .map((e) => e.text)
          .join(",");
      })
    ).toBe("100,100,100,100,100");

    await page.getByRole("button", { name: "NUM++" }).click();

    await expect(
      await getData(page, async () => {
        return $.all(".host_num")
          .map((e) => e.text)
          .join(",");
      })
    ).toBe("101,101,101,101,101");

    await page.waitForFunction(async () => {
      data.arr.splice(1, 1);
    });

    await expect((await page.$$(".sub-item")).length).toBe(2);

    await expect(await getData(page, async () => data.owner.size)).toBe("2");

    await expect(
      await getData(page, async () => {
        return $.all(".sub-val")
          .map((e) => e.text)
          .join(",");
      })
    ).toBe("I am 0,I am 2");

    await page.waitForFunction(async () => {
      data.arr.reverse();
    });

    await expect(
      await getData(page, async () => {
        return $.all(".sub-val")
          .map((e) => e.text)
          .join(",");
      })
    ).toBe("I am 2,I am 0");
  });

  test("Memory recovery within fill", async ({ page }) => {
    await page.waitForTimeout(500);

    await expect(
      await getData(page, async () => {
        return data.owner.size;
      })
    ).toBe("5");

    await page.waitForFunction(async () => {
      data.arr.push({
        val: "I am new",
      });
    });

    await expect(
      await getData(page, async () => {
        return data.owner.size;
      })
    ).toBe("6");

    await page.waitForFunction(async () => {
      // data.arr[1].childs = null;
      data.arr[1].childs = [];
    });

    await expect(
      await getData(page, async () => {
        return data.owner.size;
      })
    ).toBe("4");

    await page.waitForFunction(async () => {
      // data.arr = null;
      data.arr = [];
    });

    await expect(
      await getData(page, async () => {
        return data.owner.size;
      })
    ).toBe("0");
  });
});

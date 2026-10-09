const { test, expect } = require("@playwright/test");

const getText = async (page, expr) => {
  const text = await (await page.$(expr)).textContent();
  return text.replace(/\n/g, "").trim();
};

// 回归测试：条件组件在无子元素的构造场景下不应报错
// （第三方库如 snapdom 克隆 DOM 时，自定义元素构造函数先于子节点挂载执行）
test.describe("condition clone", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(
      "http://localhost:3398/test/statics/condition-clone-test.html"
    );
    await page.waitForTimeout(100);
  });

  test("create and clone x-if without children", async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    // Normal rendering is not affected.
    await expect(await getText(page, "cond-comp .even")).toBe("even 0");

    await page.getByRole("button", { name: "TOGGLE" }).click();
    await page.waitForTimeout(60);
    await expect(await getText(page, "cond-comp .odd")).toBe("odd 1");

    // createElement constructs the element without children; the created
    // hook must fall back gracefully when template[condition] is absent.
    const createResult = await page.evaluate(() => {
      const results = {};
      ["x-if", "x-else-if", "x-else"].forEach((tag) => {
        try {
          document.body.appendChild(document.createElement(tag));
          results[tag] = "ok";
        } catch (err) {
          results[tag] = err.message;
        }
      });
      return results;
    });

    Object.entries(createResult).forEach(([tag, result]) => {
      expect(result, `${tag} create failed`).toBe("ok");
    });

    // cloneNode re-runs the constructor on an element without children too.
    const cloneResult = await page.evaluate(() => {
      try {
        const el = document.createElement("x-if");
        const cloned = el.cloneNode(true);
        return { ok: cloned instanceof HTMLElement };
      } catch (err) {
        return { ok: false, err: err.message };
      }
    });
    expect(cloneResult.ok, `clone failed: ${cloneResult.err}`).toBe(true);

    await page.waitForTimeout(100);
    expect(pageErrors).toEqual([]);
  });
});

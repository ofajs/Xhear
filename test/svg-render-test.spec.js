const { test, expect } = require("@playwright/test");

const getText = async (page, expr) => {
  const text = await (await page.$(expr)).textContent();
  return text.replace(/\n/g, "").trim();
};

const getData = async (page, func) => {
  const result = await page.waitForFunction(func);
  return result._preview;
};

test.describe("svg render", () => {
  test.beforeEach(async ({ page }) => {
    // Go to the starting url before each test.
    await page.goto("http://localhost:3398/test/statics/svg-render-test.html");
    await page.waitForTimeout(100);
  });

  test("registered component renders svg with namespace attributes", async ({
    page,
  }) => {
    // The component's ready lifecycle must fire, which means the render
    // was not interrupted by namespace attributes like xmlns:xlink.
    await expect(
      await getData(page, async () => window.iconCompReady)
    ).toBe("1");

    // Data binding inside the component works.
    await expect(await getText(page, "svg-icon-comp .comp-label")).toBe(
      "svg-ok"
    );

    // xmlns:xlink stays on the svg element.
    const xmlnsXlink = await page.evaluate(() => {
      const icon = document
        .querySelector("svg-icon-comp")
        .shadowRoot.querySelector(".comp-icon");
      return icon.getAttribute("xmlns:xlink");
    });
    await expect(xmlnsXlink).toBe("http://www.w3.org/1999/xlink");

    // xlink:href is preserved in the XLink namespace.
    const xlinkHref = await page.evaluate(() => {
      const use = document
        .querySelector("svg-icon-comp")
        .shadowRoot.querySelector(".comp-use");
      return use.getAttributeNS("http://www.w3.org/1999/xlink", "href");
    });
    await expect(xlinkHref).toBe("#icon-star");

    // The svg and the <use> referenced shape are actually drawn.
    const boxes = await page.evaluate(() => {
      const shadow = document.querySelector("svg-icon-comp").shadowRoot;
      const boxOf = (ele) => {
        const { width, height } = ele.getBoundingClientRect();
        return { width, height };
      };
      return {
        svg: boxOf(shadow.querySelector(".comp-icon")),
        use: boxOf(shadow.querySelector(".comp-use")),
      };
    });
    await expect(boxes.svg.width).toBeGreaterThan(0);
    await expect(boxes.svg.height).toBeGreaterThan(0);
    await expect(boxes.use.width).toBeGreaterThan(0);
    await expect(boxes.use.height).toBeGreaterThan(0);
  });

  test("svg text binding updates with data", async ({ page }) => {
    await page.evaluate(() => {
      $("svg-icon-comp").val = "svg-updated";
    });
    await page.waitForTimeout(60);

    await expect(await getText(page, "svg-icon-comp .comp-label")).toBe(
      "svg-updated"
    );

    // <text> inside svg also follows the data update.
    await expect(await getText(page, "svg-icon-comp .comp-text")).toBe(
      "svg-updated"
    );
  });

  test("light DOM render with svg namespace attributes", async ({ page }) => {
    await expect(await getText(page, "#render-target .inline-caption")).toBe(
      "caption-ok"
    );

    // xlink:href is preserved in the XLink namespace.
    const xlinkHref = await page.evaluate(() => {
      const use = document.querySelector(".inline-use");
      return use.getAttributeNS("http://www.w3.org/1999/xlink", "href");
    });
    await expect(xlinkHref).toBe("#icon-heart");

    // The <use> referenced shape is actually drawn.
    const box = await page.evaluate(() => {
      const { width, height } = document
        .querySelector(".inline-use")
        .getBoundingClientRect();
      return { width, height };
    });
    await expect(box.width).toBeGreaterThan(0);
    await expect(box.height).toBeGreaterThan(0);

    // Data binding still works on the rendered content.
    await page.evaluate(() => {
      window.svgRenderData.caption = "caption-updated";
    });
    await page.waitForTimeout(60);

    await expect(await getText(page, "#render-target .inline-caption")).toBe(
      "caption-updated"
    );
  });
});

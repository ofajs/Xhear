import { test, expect } from "@playwright/test";

test("fill key", async ({ page }) => {
  await page.goto("http://localhost:3398/test/cases/fill-key/test.html");

  await page.waitForTimeout(200);

  await expect(
    await page.$eval('[data-testid="count"]', (node) => node.textContent.trim())
  ).toBe("count:10");

  const { _preview: d1 } = await page.waitForFunction(async () => {
    return $("t-one").shadow.$("t-two").shadow.$("div").text;
  });

  await expect(d1).toBe("10");

  await page.getByRole("button", { name: "Reset First" }).click();

  await page.waitForTimeout(200);

  const { _preview: d2 } = await page.waitForFunction(async () => {
    return $("t-one").shadow.$("t-two").shadow.$("div").text;
  });

  await expect(d2).toBe("reset val");

  // Updating the value does not require re-rendering the element. Re-rendering the element will cause the animation count to be increased by 1.
  await expect(
    await page.$eval('[data-testid="count"]', (node) => node.textContent.trim())
  ).toBe("count:10");

  await page.getByRole("button", { name: "Change First" }).click();
  await page.waitForTimeout(200);

  const { _preview: d3 } = await page.waitForFunction(async () => {
    return $("t-one").shadow.$("t-two").shadow.$("div").text;
  });

  await expect(d3).toBe("change val");

  // Updating the value does not require re-rendering the element. Re-rendering the element will cause the animation count to be increased by 1.
  await expect(
    await page.$eval('[data-testid="count"]', (node) => node.textContent.trim())
  ).toBe("count:10");

  await page.getByRole("button", { name: "BTN3" }).click();

  await page.waitForTimeout(200);

  const { _preview: d4 } = await page.waitForFunction(async () => {
    return $("t-one").shadow.$("t-two").shadow.$("div").text;
  });

  await expect(d4).toBe("103");
});

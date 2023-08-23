// npx playwright codegen http://localhost:3398/test/cases/memory-recovery/demo1-2.html

import { test, expect } from "@playwright/test";

test("normal recovery", async ({ page }) => {
  await page.goto(
    "http://localhost:3398/test/cases/memory-recovery/demo1.html"
  );

  await page.getByRole("button", { name: "refresh length" }).click();
  await new Promise((res) => setTimeout(res), 30);
  expect(await page.$eval("#logger", (node) => node.textContent)).toBe("3");

  await page.getByRole("button", { name: "remove demo" }).click();
  await page.getByRole("button", { name: "refresh length" }).click();
  await new Promise((res) => setTimeout(res), 30);
  expect(await page.$eval("#logger", (node) => node.textContent)).toBe("2");

  await page.getByRole("button", { name: "remove demo" }).click();
  await page.getByRole("button", { name: "remove demo" }).click();
  await page.getByRole("button", { name: "refresh length" }).click();
  await new Promise((res) => setTimeout(res), 30);
  expect(await page.$eval("#logger", (node) => node.textContent)).toBe("0");
});

test("transmit data recovery", async ({ page }) => {
  await page.goto(
    "http://localhost:3398/test/cases/memory-recovery/demo2.html"
  );

  await new Promise((res) => setTimeout(res), 30);
  const { _preview: beforeSize } = await page.waitForFunction(async () => {
    return outerData.sub.owner.size;
  });
  expect(beforeSize).toBe("4");

  await page.getByRole("button", { name: "refresh length" }).click();
  await new Promise((res) => setTimeout(res), 30);
  expect(await page.$eval("#logger", (node) => node.textContent)).toBe("6");

  await page.getByRole("button", { name: "remove demo" }).click();
  await page.getByRole("button", { name: "refresh length" }).click();
  await new Promise((res) => setTimeout(res), 30);
  expect(await page.$eval("#logger", (node) => node.textContent)).toBe("4");

  await page.getByRole("button", { name: "remove demo" }).click();
  await page.getByRole("button", { name: "remove demo" }).click();
  await page.getByRole("button", { name: "refresh length" }).click();
  await new Promise((res) => setTimeout(res), 30);
  expect(await page.$eval("#logger", (node) => node.textContent)).toBe("0");

  await new Promise((res) => setTimeout(res), 30);
  const { _preview: afterSize } = await page.waitForFunction(async () => {
    return outerData.sub.owner.size;
  });
  expect(afterSize).toBe("1");
});

test("fill data recovery", async ({ page }) => {
  await page.goto(
    "http://localhost:3398/test/cases/memory-recovery/demo3.html"
  );

  await new Promise((res) => setTimeout(res), 30);

  const { _preview: beforeSize } = await page.waitForFunction(async () => {
    return outerData.arr.owner.size;
  });

  expect(beforeSize).toBe("2");

  await page.getByRole("button", { name: "remove demo" }).click();
  await new Promise((res) => setTimeout(res), 30);

  const { _preview: afterSize } = await page.waitForFunction(async () => {
    return outerData.arr.owner.size;
  });

  expect(afterSize).toBe("1");
});

test("condition data recovery", async ({ page }) => {
  await page.goto(
    "http://localhost:3398/test/cases/memory-recovery/demo4.html"
  );

  await new Promise((res) => setTimeout(res), 30);

  const { _preview: beforeSize } = await page.waitForFunction(async () => {
    return outerData.owner.size;
  });

  expect(beforeSize).toBe("2");

  await page.getByRole("button", { name: "add count" }).click();
  await page.getByRole("button", { name: "add count" }).click();
  await page.getByRole("button", { name: "add count" }).click();
  await new Promise((res) => setTimeout(res), 30);

  await page.getByRole("button", { name: "remove demo" }).click();

  const { _preview: afterSize } = await page.waitForFunction(async () => {
    return outerData.owner.size;
  });
  expect(afterSize).toBe("0");
});

test("component data owner size", async ({ page }) => {
  await page.goto(
    "http://localhost:3398/test/cases/memory-recovery/demo5.html"
  );

  await new Promise((res) => setTimeout(res), 30);

  await page.getByRole("button", { name: "refresh owner size" }).click();
  expect(await page.$eval("#logger", (node) => node.textContent)).toBe("10");
  await page.getByRole("button", { name: "refresh arr owner size" }).click();
  expect(await page.$eval("#logger", (node) => node.textContent)).toBe(
    "[4,4,4]"
  );

  await page.getByRole("button", { name: "add count" }).click();
  await new Promise((res) => setTimeout(res), 30);

  await page.getByRole("button", { name: "refresh owner size" }).click();
  expect(await page.$eval("#logger", (node) => node.textContent)).toBe("10");
  await page.getByRole("button", { name: "refresh arr owner size" }).click();
  expect(await page.$eval("#logger", (node) => node.textContent)).toBe(
    "[4,4,4]"
  );

  await page.getByRole("button", { name: "add count" }).click();
  await new Promise((res) => setTimeout(res), 30);

  await page.getByRole("button", { name: "refresh owner size" }).click();
  expect(await page.$eval("#logger", (node) => node.textContent)).toBe("1");
  await page.getByRole("button", { name: "refresh arr owner size" }).click();
  expect(await page.$eval("#logger", (node) => node.textContent)).toBe(
    "[1,1,1]"
  );
});

test("loop object recovery", async ({ page }) => {
  await page.goto(
    "http://localhost:3398/test/cases/memory-recovery/demo1-2.html"
  );

  await page.getByRole("button", { name: "refresh length" }).click();
  expect(await page.$eval("#logger", (node) => node.textContent)).toBe("1");

  await page.getByRole("button", { name: "demopp" }).click();
  await page.getByRole("button", { name: "refresh length" }).click();
  expect(await page.$eval("#logger", (node) => node.textContent)).toBe("3");

  await page.getByRole("button", { name: "demopp" }).click();
  await page.getByRole("button", { name: "refresh length" }).click();
  expect(await page.$eval("#logger", (node) => node.textContent)).toBe("1");

  await page.getByRole("button", { name: "demopp" }).click();
  await page.getByRole("button", { name: "refresh length" }).click();
  expect(await page.$eval("#logger", (node) => node.textContent)).toBe("4");

  await page.getByRole("button", { name: "demopp" }).click();
  await page.getByRole("button", { name: "refresh length" }).click();
  expect(await page.$eval("#logger", (node) => node.textContent)).toBe("1");

  await page.getByRole("button", { name: "demopp" }).click();
  await page.getByRole("button", { name: "refresh length" }).click();
  expect(await page.$eval("#logger", (node) => node.textContent)).toBe("5");

  await page.getByRole("button", { name: "demopp" }).click();
  await page.getByRole("button", { name: "refresh length" }).click();
  expect(await page.$eval("#logger", (node) => node.textContent)).toBe("1");

  await page.getByRole("button", { name: "demopp" }).click();
  await page.getByRole("button", { name: "refresh length" }).click();
  expect(await page.$eval("#logger", (node) => node.textContent)).toBe("6");

  await page.getByRole("button", { name: "demopp" }).click();
  await page.getByRole("button", { name: "refresh length" }).click();
  expect(await page.$eval("#logger", (node) => node.textContent)).toBe("1");

  await page.getByRole("button", { name: "demopp" }).click();
  await page.getByRole("button", { name: "refresh length" }).click();
  expect(await page.$eval("#logger", (node) => node.textContent)).toBe("7");

  await page.getByRole("button", { name: "demopp" }).click();
  await page.getByRole("button", { name: "refresh length" }).click();
  expect(await page.$eval("#logger", (node) => node.textContent)).toBe("1");
});

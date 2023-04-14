const { default: stanz } = require("../dist/stanz");

describe("Test the methods owned by the Stanz instance", () => {
  test("revoke test", () => {
    const d = stanz({
      val: "I am d",
      obj: {
        val: "I am obj",
        sub: {
          val: "I am sub",
        },
      },
    });

    const obj = d.obj;
    d.push(obj);
    const sub = d.obj.sub;

    expect(obj.sub).toBe(sub);
    expect(sub.owner.size).toBe(1);
    expect(d.obj).toBe(obj);
    expect(d[0]).toBe(obj);

    obj.revoke();

    expect(sub.owner.size).toBe(0);
    expect(d.obj).toBe(null);
    expect(d[0]).toBe(null);
  });

  test("is test", () => {
    const a = { val: "I am a" };
    const b = stanz({ val: "I am b" });

    expect(stanz.is(a)).toBe(false);
    expect(stanz.is(b)).toBe(true);
  });
});

test("extend test", () => {
  const d = stanz({ val: "I am d" });

  d.extend({
    _a: 0,
    set a(val) {
      this._a = val;
    },
    get a() {
      return this._a + 100;
    },
  });

  const keys = Object.keys(d);

  expect(keys).toEqual(["val", "_a", "a"]);
  expect(d.a).toBe(100);
  d.a++;
  expect(d.a).toBe(201);
});

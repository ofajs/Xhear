const { default: stanz } = require("../dist/stanz");

describe("stanz test of access rights", () => {
  test("accessor test: set and get", () => {
    const d = stanz({
      get a() {
        return (this._a || 0) + 1;
      },
      set a(val) {
        this._a = val;
      },
    });

    expect(d.a).toEqual(1);

    d.a = 100;

    expect(d.a).toEqual(101);
  });

  test("accessor test: _", () => {
    const d = stanz({
      a: 222,
      _b: 111,
    });

    expect(d.a).toEqual(222);

    expect(d._b).toEqual(111);

    const keys = Object.keys(d);

    expect(keys).toContain("a");
    expect(keys).not.toContain("_b");
  });

  test("accessor test set: object", () => {
    const d = stanz({
      o1: {
        val: "I am o1",
      },
    });

    d.o2 = {
      val: "I am o2",
    };

    const o3 = stanz({
      val: "I am o3",
    });

    d.o3 = o3;

    const a1 = stanz([100, 200, 300]);

    d.a1 = a1;

    expect(d.o1.owner.has(d)).toBe(true);
    expect(d.o2.owner.has(d)).toBe(true);
    expect(d.o3).toBe(o3);
    expect(d.o3.owner.has(d)).toBe(true);
    expect(d.a1).toBe(a1);
    expect(d.a1.owner.has(d)).toBe(true);

    const { o1, o2 } = d;

    expect(o1.owner.size === 1).toBe(true);
    expect(o2.owner.size === 1).toBe(true);
    expect(o3.owner.size === 1).toBe(true);

    delete d.o1;
    delete d.o2;
    delete d.o3;

    expect(o1.owner.size === 0).toBe(true);
    expect(o2.owner.size === 0).toBe(true);
    expect(o3.owner.size === 0).toBe(true);
  });

  test("accessor test: array", () => {
    const d = stanz({
      0: {
        val: "I am 0",
      },
      o1: {
        val: "I am o1",
      },
    });

    d.push({
      val: "I am 1",
    });

    expect(d[0].owner.has(d)).toBe(true);
    expect(d[1].owner.has(d)).toBe(true);

    const o0 = d[0];
    const o0_b = d.shift();

    expect(o0).toBe(o0_b);
    expect(o0.owner.size).toBe(0);

    const o1 = d[0];
    const o2 = stanz({
      val: "I am 3",
    });

    expect(o1.owner.has(d)).toBe(true);

    d.splice(0, 1, o2);

    expect(o1.owner.has(d)).toBe(false);
    expect(o2.owner.has(d)).toBe(true);
  });

  test("accessor repeat test", () => {
    const d = stanz([
      { val: "V1" },
      { val: "V2" },
      { val: "V3" },
      { val: "V4" },
    ]);

    const v2 = d[0];

    expect(v2.owner.has(d)).toBe(true);
    expect(v2._owner.length).toBe(1);

    d.push(v2);
    expect(v2.owner.has(d)).toBe(true);
    expect(v2._owner.length).toBe(2);

    d.h = v2;
    expect(v2.owner.has(d)).toBe(true);
    expect(v2._owner.length).toBe(3);

    delete d.h;
    expect(v2.owner.has(d)).toBe(true);
    expect(v2._owner.length).toBe(2);

    d.pop();
    expect(v2.owner.has(d)).toBe(true);
    expect(v2._owner.length).toBe(1);

    d.shift();
    expect(v2.owner.has(d)).toBe(false);
    expect(v2._owner.length).toBe(0);
  });

  test("accessor coverage value test", () => {
    const d = stanz({
      a1: {
        val: "I am a1",
      },
    });

    const { a1 } = d;

    expect(a1.owner.has(d)).toBe(true);

    d.a1 = "cover it";

    expect(a1.owner.has(d)).toBe(false);
  });

  test("set same value", () => {
    const d = stanz({ val: "I am d" });

    let i = 0;

    d.watch((e) => {
      i++;
      throw "error";
    });

    d.val = "I am d";

    expect(i).toBe(0);
  });
});

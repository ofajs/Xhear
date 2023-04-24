const { default: stanz } = require("../dist/stanz");

describe("Test if the watch method of the instance is correct", () => {
  test("watch modified values", () => {
    const d = stanz({
      val: "I am d",
      obj: {
        val: "I am obj",
        sub: {
          val: "I am sub",
        },
      },
    });

    const d2 = stanz({
      val: "I am e",
      inner: {
        val: "I am Inner",
      },
    });

    const obj = d.obj;
    d.push(obj);

    const sub = d.obj.sub;

    d2.inner.obj = obj;

    let i = 0;

    d.watch((e) => {
      expect(e.type).toBe("set");
      i++;
      if (i === 1) {
        expect(e.target).toBe(d);
        expect(e.path.length).toBe(0);
      } else if (i === 2) {
        expect(e.target).toBe(obj);
        expect(e.path.length).toBe(1);
      } else if (i === 3) {
        expect(e.target).toBe(sub);
        expect(e.path.length).toBe(2);
      }
    });

    d2.watch((e) => {
      if (i === 2) {
        expect(e.target).toBe(obj);
        expect(e.path.length).toBe(2);
      } else if (i === 3) {
        expect(e.target).toBe(sub);
        expect(e.path.length).toBe(3);
      }
    });

    d.val = "change d val";
    obj.val = "change obj val";
    sub.val = "change sub val";

    expect(i).toBe(3);
  });

  test("watch array change", () => {
    const d = stanz([
      { val: "I am v0" },
      { val: "I am v1" },
      { val: "I am v2" },
      { val: "I am v3", arr: [{ val: "v3 sub 0" }, { val: "v3 sub 1" }] },
      [{ val: "I am v4 sub1" }, { val: "I am v4 sub2" }],
    ]);

    let i = 0;
    d.watch((e) => {
      expect(e.type).toBe("array");
      i++;
      if (i === 1) {
        expect(e.args).toEqual([{ val: "v3 after push" }]);
        expect(e.path.length).toBe(2);
      } else if (i === 2) {
        expect(e.args).toEqual([{ val: "v4 after push" }]);
        expect(e.path.length).toBe(1);
      } else if (i === 3) {
        expect(e.args).toEqual([{ val: "I am v5" }]);
        expect(e.path.length).toBe(0);
      }
    });

    d[3].arr.push({
      val: "v3 after push",
    });

    d[3].push({
      val: "v4 after push",
    });

    d.push({
      val: "I am v5",
    });

    expect(i).toBe(3);
  });

  test("watch delete", () => {
    const d = stanz({
      val: "I am d",
      test: "test delete this",
      obj: {
        val: "I am obj",
        test2: "test delete this 2",
      },
    });

    const d2 = stanz({
      obj2: {
        sub: d.obj,
      },
    });

    let i = 0;
    d.watch((e) => {
      expect(e.type).toBe("delete");
      i++;
      if (i == 1) {
        expect(e.path.length).toBe(0);
      } else if (i === 2) {
        expect(e.path.length).toBe(1);
      }
    });

    d2.watch((e) => {
      expect(e.type).toBe("delete");
      if (i === 2) {
        expect(e.path.length).toBe(2);
      }
    });

    delete d.test;
    delete d.obj.test2;

    expect(i).toBe(2);
  });

  test("test _update", () => {
    const d = stanz({
      obj: {
        val: "I am obj",
      },
      val: "I am d",
    });

    let i = 0;
    d.watch(() => {
      i++;
      throw "update in";
    });

    d.obj._update = false;
    d.obj.val = "change obj val";

    expect(i).toBe(0);
  });

  test("test unwatch", () => {
    const d = stanz({
      obj: {
        val: "I am obj",
      },
      val: "I am d",
    });

    let i = 0;
    const wid = d.watch(() => {
      if (i) {
        throw "update in";
      }
      i++;
    });

    d.obj.val = "change obj val";
    d.unwatch(wid);
    d.obj.val = "change obj val2";

    expect(i).toBe(1);
  });

  test("test watchTick", async () => {
    const d = stanz({
      val: "I am d",
      test: "test delete this",
      obj: {
        val: "I am obj",
        test2: "test delete this 2",
      },
    });

    let i = 0;
    d.watchTick((e) => {
      i++;

      expect(e.length).toBe(2);

      if (i > 1) {
        throw "watch error";
      }
    });

    delete d.test;
    delete d.obj.test2;

    await new Promise((res) => setTimeout(res, 100));

    expect(i).toBe(1);
  });

  test("test watcher", () => {
    const d = stanz({
      val: "I am d",
      obj: {
        val: "I am obj",
        sub: {
          val: "I am sub",
        },
        oarr: [1, 2, 3],
      },
      arr: [7, 3, 6, 4, 9, 2, 1],
    });

    let i = 0;

    d.watch((e) => {
      i++;
      if (i === 1) {
        expect(e.hasModified("arr")).toBe(true);
        expect(e.hasReplaced("arr")).toBe(false);
      } else if (i === 2) {
        expect(e.hasModified("arr")).toBe(true);
        expect(e.hasReplaced("arr")).toBe(false);
      } else if (i === 3) {
        expect(e.hasModified("arr")).toBe(true);
        expect(e.hasReplaced("arr")).toBe(true);
      }

      expect(e.hasModified("obj")).toBe(false);
      expect(e.hasReplaced("obj")).toBe(false);
    });

    d.arr.push(11);
    d.arr.reverse();
    d.arr = [222, 333];
  });

  test("test watchers", async () => {
    const d = stanz({
      val: "I am d",
      obj: {
        val: "I am obj",
        sub: {
          val: "I am sub",
        },
        oarr: [1, 2, 3],
      },
      arr: [7, 3, 6, 4, 9, 2, 1],
    });

    let i = 0;

    d.watchTick((e) => {
      i++;

      if (i === 1) {
        expect(e.hasModified("arr")).toBe(true);
        expect(e.hasReplaced("arr")).toBe(false);

        expect(e.hasModified("obj")).toBe(false);
        expect(e.hasReplaced("obj")).toBe(false);
      } else if (i === 2) {
        expect(e.hasModified("arr")).toBe(true);
        expect(e.hasReplaced("arr")).toBe(true);

        expect(e.hasModified("obj")).toBe(true);
        expect(e.hasReplaced("obj")).toBe(false);
      }
    });

    d.arr.push(11);

    await new Promise((res) => setTimeout(res, 100));

    d.arr = [100, 200];
    d.obj.oarr.push(11);

    await new Promise((res) => setTimeout(res, 100));

    expect(i).toBe(2);
  });

  test("test watcher [point key]", () => {
    const d = stanz({
      val: "I am d",
      obj: {
        val: "I am obj",
        sub: {
          val: "I am sub",
          oarr: [1, 2, 3],
        },
      },
    });

    let i = 0;

    d.watch((e) => {
      i++;

      if (i === 1) {
        expect(e.hasModified("obj.sub.oarr")).toBe(true);
        expect(e.hasModified("obj.sub")).toBe(true);
        expect(e.hasModified("obj")).toBe(true);
        expect(e.hasModified("obj.sub.val")).toBe(false);
        expect(e.hasReplaced("obj.sub.oarr")).toBe(false);
        expect(e.hasReplaced("obj.sub")).toBe(false);
        expect(e.hasReplaced("obj")).toBe(false);
      } else if (i === 2) {
        expect(e.hasModified("obj.sub.oarr")).toBe(true);
        expect(e.hasModified("obj.sub")).toBe(true);
        expect(e.hasModified("obj")).toBe(true);
        expect(e.hasModified("obj.sub.val")).toBe(false);
        expect(e.hasReplaced("obj.sub.oarr")).toBe(true);
        expect(e.hasReplaced("obj.sub")).toBe(false);
        expect(e.hasReplaced("obj")).toBe(false);
      } else if (i === 3) {
        expect(e.hasModified("obj.sub.oarr")).toBe(false);
        expect(e.hasModified("obj.sub")).toBe(true);
        expect(e.hasModified("obj")).toBe(true);
        expect(e.hasModified("obj.sub.val")).toBe(true);
        expect(e.hasReplaced("obj.sub.val")).toBe(true);
        expect(e.hasReplaced("obj.sub.oarr")).toBe(false);
        expect(e.hasReplaced("obj.sub")).toBe(false);
        expect(e.hasReplaced("obj")).toBe(false);
      }
    });

    d.obj.sub.oarr.push(5);
    d.obj.sub.oarr = [4, 5, 6];
    d.obj.sub.val = "change sub val";
  });
});

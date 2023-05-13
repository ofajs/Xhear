const stanz = require("../dist/stanz");

describe("Tests related to conversion data", () => {
  test("toJson test array", () => {
    const d = stanz([100]);

    expect(d.toJSON()).toEqual([100]);
  });

  test("toJson test object", () => {
    const d = stanz({
      val: "I am val",
    });

    expect(d.toJSON()).toEqual({
      val: "I am val",
    });
  });

  test("toJson test object mix array", () => {
    const d = stanz({
      val: "I am val",
    });

    d.push(100);

    expect(d.toJSON()).toEqual({
      0: 100,
      val: "I am val",
    });
  });

  test("toJson object has xid", () => {
    const d = stanz({
      val: "I am val",
    });

    expect(d.toJSON().xid).toEqual(d.xid);
  });
});

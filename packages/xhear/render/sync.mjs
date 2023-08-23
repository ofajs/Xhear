const syncFn = {
  sync(propName, targetName, options) {
    if (!options) {
      throw `Sync is only allowed within the renderer`;
    }

    [propName, targetName] = options.beforeArgs;

    const { data } = options;

    this[propName] = data.get(targetName);

    const wid1 = this.watch((e) => {
      if (e.hasModified(propName)) {
        let value;
        try {
          value = this.get(propName);
          data.set(targetName, value);
        } catch (err) {
          debugger;
        }
      }
    });

    const wid2 = data.watch((e) => {
      if (e.hasModified(targetName)) {
        let value;
        try {
          value = data.get(targetName);
        } catch (err) {
          debugger;
        }
        this.set(propName, value);
      }
    });

    return () => {
      try {
        this.set(propName, null);
        data.set(targetName, null);
      } catch (err) {
        debugger;
      }
      this.unwatch(wid1);
      data.unwatch(wid2);
    };
  },
};

syncFn.sync.revoke = (e) => {
  console.log("revoke", e);
  e.result();
};

export default syncFn;

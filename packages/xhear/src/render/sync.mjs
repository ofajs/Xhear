export default {
  sync(propName, targetName, options) {
    if (!options) {
      throw `Sync is only allowed within the renderer`;
    }

    const { data } = options;

    this[propName] = data[targetName];

    this.watch((e) => {
      if (e.hasModified(propName)) {
        data[targetName] = this[propName];
      }
    });

    data.watch((e) => {
      if (e.hasModified(targetName)) {
        this[propName] = data[targetName];
      }
    });
  },
};

export default new Proxy(
  {},
  {
    get(target, prop) {
      return () => {
        throw new Error(`[unpdf] path2d-polyfill.${prop} is not implemented`);
      };
    },
  },
);

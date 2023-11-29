export default new Proxy(
  {},
  {
    get(target, prop) {
      return () => {
        throw new Error(`[unpdf] canvas.${prop} is not implemented`);
      };
    },
  },
);

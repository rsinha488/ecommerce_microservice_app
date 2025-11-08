export default () => ({
  order: {
    port: process.env.PORT ? Number(process.env.PORT) : 5003,
    defaultCurrency: process.env.DEFAULT_CURRENCY || 'USD',
  },
});

export const healthMethods = {
  health: async (params: unknown) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  },
};

type RpcMethod = (params: any, context?: any) => Promise<any>;

export const healthMethods: Record<string, RpcMethod> = {
  health: async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  },
};

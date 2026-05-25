export const redisKeys = {
    refreshToken: (userId: number) => `refresh:user:${userId}`,
    loginAttempts: (email: string) => `login:attempts:${email}`,
    dashboardStats: (userId: number) => `dashboard:stats:user:${userId}`,
};

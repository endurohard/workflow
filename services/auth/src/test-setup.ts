// Setup environment variables for testing
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_ACCESS_EXPIRATION = '15m';
process.env.JWT_REFRESH_EXPIRATION = '7d';
process.env.JWT_RESET_EXPIRATION = '1h';
process.env.NODE_ENV = 'test';

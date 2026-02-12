export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/*.test.js'],
  testTimeout: 10000,
  forceExit: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!node_modules/**',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};

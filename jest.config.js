/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/singleton.ts"],
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "src/models/**/*.ts",
    "src/middlewares/**/*.ts",
    "src/lib/customErrors.ts",
    "!src/models/**/*.dto.ts",
    "!src/models/**/*.router.ts" // 라우터 및 DTO는 로직보다는 구조 선언용이라 커버리지에서 제외
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
};

import type { Config } from "jest";

const defaultTestPaths = "tests";
const testMatch = (process.env.TEST_PATHS || defaultTestPaths)
    .split(",")
    .map((path) => `**/${path.replace("./", "")}/**/?(*.)+(spec|test).+(ts)`);
const config: Config = {
    coverageDirectory: "coverage",
    collectCoverageFrom: ["src/**/*.ts"],
    coveragePathIgnorePatterns: ["/examples/"],
    transform: {
        "^.+\\.tsx?$": "ts-jest",
    },
    testEnvironment: "jsdom",
    testPathIgnorePatterns: ["/node_modules/", "/container.test.ts"],
    testResultsProcessor: "jest-sonar-reporter",
    coverageReporters: ["cobertura", "text-summary", "text", "lcov"],
    setupFiles: ["<rootDir>/jest.setup.ts"],
    reporters: [
        "default",
        [
            "jest-junit",
            {
                outputDirectory: "coverage",
            },
        ],
    ],
    testMatch,
    verbose: true,
    moduleNameMapper: {
        "socket.io-client/dist/socket.io.msgpack.min.js": "socket.io-client/dist/socket.io.js",
    },
};

export default config;

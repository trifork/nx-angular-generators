import { getJestProjects } from "@nrwl/jest";

export default {
  projects: getJestProjects(),
  displayName: "nx-angular-generators",
  preset: "./jest.preset.js",
  transform: {
    "^.+\\.[tj]s$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.spec.json" }],
  },
  moduleFileExtensions: ["ts", "js", "html"],
  coverageDirectory: "./coverage",
};

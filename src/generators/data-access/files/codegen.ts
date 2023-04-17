import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "../shared/schema/graphql/schema.graphqls",
  // documents: './libs/**/schema.graphql',
  documents:
    "libs/diabetes/admin/data-access/src/lib/graphql/whitelist.graphql",
  generates: {
    "libs/diabetes/shared/api/data-access/src/lib/generated/api-schema-types.generated.ts":
      {
        plugins: ["typescript"],
      },
    "libs/diabetes/admin/data-access/src/lib/generated/": {
      preset: "near-operation-file",
      presetConfig: {
        extension: ".generated.ts",
        folder: "../generated",
        baseTypesPath: "~@sam/diabetes/shared/api/data-access",
      },
      plugins: ["typescript-operations", "typescript-apollo-angular"],
      config: { addExplicitOverride: true, withHooks: true },
    },
  },
};
export default config;

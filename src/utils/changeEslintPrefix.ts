import { Tree, updateJson } from '@nrwl/devkit';

export type moduleBoundsRuleConfig = [
  string,
  {
    allow: string[];
    depConstraints: { sourceTag: string; onlyDependOnLibsWithTags: string[] }[];
  }
];
export type selectorRuleConfig = [
  string,
  {
    type: string;
    prefix: string;
    style: string;
  }
];

export interface eslintJSON {
  overrides?: {
    files: string[];
    rules: {
      '@nrwl/nx/enforce-module-boundaries'?: moduleBoundsRuleConfig;
      '@angular-eslint/directive-selector'?: selectorRuleConfig;
      '@angular-eslint/component-selector'?: selectorRuleConfig;
    };
  }[];
}

export async function changeEslintPrefix(
  tree: Tree,
  projectRoot: string,
  newPrefix: string
) {
  updateJson(tree, `${projectRoot}/.eslintrc.json`, (eslint: eslintJSON) => {
    const override = eslint?.overrides?.find(
      (override) => override.rules['@angular-eslint/component-selector']
    );
    const directiveSelectorRule = override?.rules['@angular-eslint/directive-selector'];
    const componentSelectorRule = override?.rules['@angular-eslint/component-selector'];

    if (directiveSelectorRule) directiveSelectorRule[1].prefix = newPrefix;
    if (componentSelectorRule) componentSelectorRule[1].prefix = newPrefix;
    // return modified JSON object
    return eslint;
  });
}

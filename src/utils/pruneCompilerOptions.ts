import { Tree, updateJson } from '@nrwl/devkit';

interface tsConfigJSON {
  compilerOptions?: object;
  [key: string]: object | undefined;
}

export async function pruneCompilerOptions(tree: Tree, projectRoot: string) {
  updateJson(tree, `${projectRoot}/tsconfig.json`, (tsconfig: tsConfigJSON) => {
    delete tsconfig.compilerOptions;
    // return modified JSON object
    return tsconfig;
  });
}

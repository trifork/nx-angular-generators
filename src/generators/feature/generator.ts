import { libraryGenerator } from '@nrwl/angular/generators';
import { formatFiles, getWorkspaceLayout, Tree } from '@nrwl/devkit';
import { configurationGenerator as stylelintConfigGenerator, scssGenerator, } from 'nx-stylelint';
import { kebabify } from '../../utils/naming';
import { pruneCompilerOptions } from '../../utils/pruneCompilerOptions';
import { generateTags } from '../../utils/tags.util';
import { FeatureGeneratorSchema } from './schema';
import { changeEslintPrefix } from '../../utils/changeEslintPrefix';

interface NormalizedSchema extends FeatureGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
}

function normalizeOptions(tree: Tree, options: FeatureGeneratorSchema): NormalizedSchema {
  const { domainName, featureName } = options;
  const projectDirectory = `${kebabify(options.superDomainName)}/${kebabify(
    domainName
  )}/${libType}-${featureName}`;
  const projectName = `${libType}-${featureName}`;
  const projectRoot = `${getWorkspaceLayout(tree).libsDir}/${projectDirectory}`;

  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory,
  };
}

const libType = 'feature';

export default async function (tree: Tree, options: FeatureGeneratorSchema) {
  const normalizedOptions = normalizeOptions(tree, options);
  const { projectName, featureName, domainName, projectRoot, superDomainName } =
    normalizedOptions;
  const fullResultingProjectName = `${superDomainName}-${domainName}-${libType}-${featureName}`;
  const selectorPrefix = kebabify(superDomainName);

  // Generate standard lib
  const tags = generateTags({
    types: [ "lib", libType ],
    scopes: [ superDomainName, domainName ]
  })

  await libraryGenerator(tree, {
    selector: `${kebabify(superDomainName)}-rename-this`,
    buildable: true,
    name: projectName,
    standalone: true,
    routing: true,
    lazy: true,
    displayBlock: true,
    style: 'scss',
    simpleName: true,
    directory: `${superDomainName}/${domainName}`,
    tags
  });

  // Generate stylelint
  await stylelintConfigGenerator(tree, {
    project: fullResultingProjectName,
    skipFormat: false,
    formatter: 'string',
  });

  // Generate scss
  await scssGenerator(tree, {
    project: fullResultingProjectName,
    skipFormat: false,
  });

  //   Prune compileroptions from the new tsconfig
  await pruneCompilerOptions(tree, projectRoot);
  await changeEslintPrefix(tree, projectRoot, selectorPrefix);

  await formatFiles(tree);
}

import { libraryGenerator } from '@nrwl/angular/generators';
import { formatFiles, getWorkspaceLayout, Tree } from '@nrwl/devkit';
import {
  scssGenerator,
  configurationGenerator as stylelintConfigGenerator,
} from 'nx-stylelint';
import { kebabify } from '../../utils/naming';
import { pruneCompilerOptions } from '../../utils/pruneCompilerOptions';
import { generateSourceTagsGeneric, tagsGenerator } from '../tags/generator';
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
  const sourceTags = generateSourceTagsGeneric(
    superDomainName,
    domainName,
    libType,
    featureName
  );
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
    directory: superDomainName + '/' + domainName,
    tags: Object.values(sourceTags).join(),
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

  // Update tags and set rules
  await tagsGenerator(tree, {
    superDomainName: options.superDomainName,
    allowedSubDomainsInShared: ['api-models'],
    allOfSharedAllowed: true,
    allowedLibTypesInDomain: ['models', 'state', 'ui', 'util'],
    domainName,
    libType,
    libName: featureName,
  });

  //   Prune compileroptions from the new tsconfig
  await pruneCompilerOptions(tree, projectRoot);
  await changeEslintPrefix(tree, projectRoot, selectorPrefix);

  await formatFiles(tree);
}

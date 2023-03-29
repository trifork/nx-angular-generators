import { libraryGenerator } from '@nrwl/angular/generators';
import { formatFiles, generateFiles, getWorkspaceLayout, names, offsetFromRoot, Tree } from '@nrwl/devkit';
import * as path from 'path';
import { formatCapitalizations, kebabify } from '../../utils/naming';
import { pruneCompilerOptions } from '../../utils/pruneCompilerOptions';
import { generateSourceTagsGeneric, tagsGenerator } from '../tags/generator';
import { DataAccessGeneratorSchema } from './schema';

interface NormalizedSchema extends DataAccessGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
}

function normalizeOptions(tree: Tree, options: DataAccessGeneratorSchema): NormalizedSchema {
  const projectDirectory = `${kebabify(options.domainName)}/${kebabify(libType)}`;
  const projectName = libType;
  const projectRoot = `${getWorkspaceLayout(tree).libsDir}/${projectDirectory}`;

  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory,
    ...formatCapitalizations(options.domainName, true),
  };
}

function addFiles(tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(libType),
    fileName: options.projectName,
    offsetFromRoot: offsetFromRoot(options.projectRoot),
    template: '',
  };
  generateFiles(tree, path.join(__dirname, 'files'), options.projectRoot, templateOptions);
}

const libType = 'data_access';

export default async function (tree: Tree, options: DataAccessGeneratorSchema) {
  // Generate standard lib
  const sourceTags = generateSourceTagsGeneric(options.domainName, libType);
  await libraryGenerator(tree, {
    buildable: true,
    name: libType,
    skipModule: true,
    directory: options.domainName,
    tags: Object.values(sourceTags).join(),
  });

  // Update tags and set rules
  await tagsGenerator(tree, {
    allowedSubDomainsInShared: ['util', 'auth'],
    allowedLibTypesInDomain: ['util', 'models'],
    domainName: options.domainName,
    libType,
  });

  // Add template files
  const normalizedOptions = normalizeOptions(tree, options);
  addFiles(tree, normalizedOptions);

  // Prune compileroptions from the new tsconfig
  pruneCompilerOptions(tree, normalizedOptions.projectRoot);

  await formatFiles(tree);
}

import { libraryGenerator } from '@nrwl/angular/generators';
import { formatFiles, generateFiles, getWorkspaceLayout, names, offsetFromRoot, Tree } from '@nrwl/devkit';
import * as path from 'path';
import { formatCapitalizations, kebabify } from '../../utils/naming';
import { pruneCompilerOptions } from '../../utils/pruneCompilerOptions';
import { generateSourceTagsGeneric, tagsGenerator } from '../tags/generator';
import { StateGeneratorSchema } from './schema';

interface NormalizedSchema extends StateGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
}

const libType = 'state';

function normalizeOptions(tree: Tree, options: StateGeneratorSchema): NormalizedSchema {
  const initialSubStoreName = options.initialSubStoreName;
  const projectDirectory = `${kebabify(options.domainName)}/${libType}`;
  const projectName = libType;

  const projectRoot = `${getWorkspaceLayout(tree).libsDir}/${projectDirectory}`;

  return {
    ...options,
    projectName,
    initialSubStoreName,
    projectRoot,
    projectDirectory,
  };
}

function addFiles(tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(libType),
    fileName: options.initialSubStoreName,
    ...formatCapitalizations(options.initialSubStoreName, false),
    ...formatCapitalizations(options.domainName, true),
    offsetFromRoot: offsetFromRoot(options.projectRoot),
    template: '',
  };
  generateFiles(tree, path.join(__dirname, 'files'), options.projectRoot, templateOptions);
}

export default async function (tree: Tree, options: StateGeneratorSchema) {
  // Generate standard lib
  const sourceTags = generateSourceTagsGeneric(options.domainName, libType);
  await libraryGenerator(tree, {
    name: libType,
    buildable: true,
    skipModule: true,
    directory: options.domainName,
    tags: Object.values(sourceTags).join(),
  });

  // Update tags and set rules
  await tagsGenerator(tree, {
    allowedSubDomainsInShared: ['auth', 'data-access'],
    allowedLibTypesInDomain: ['data_access', 'models', 'util'],
    domainName: options.domainName,
    libType: 'state',
  });

  // Add template files
  const normalizedOptions = normalizeOptions(tree, options);
  addFiles(tree, normalizedOptions);

  // Prune compileroptions from the new tsconfig
  pruneCompilerOptions(tree, normalizedOptions.projectRoot);

  await formatFiles(tree);
}

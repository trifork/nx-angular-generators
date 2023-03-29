import { libraryGenerator } from '@nrwl/angular/generators';
import { formatFiles, generateFiles, getWorkspaceLayout, names, offsetFromRoot, Tree } from '@nrwl/devkit';
import * as path from 'path';
import { kebabify } from '../../utils/naming';
import { pruneCompilerOptions } from '../../utils/pruneCompilerOptions';
import { generateSourceTagsShared, tagsGenerator } from '../tags/generator';
import { TagsGeneratorOptionsShared } from '../tags/generator.model';
import { SharedGeneratorSchema } from './schema';

interface NormalizedSchema extends SharedGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
}

function normalizeOptions(tree: Tree, options: SharedGeneratorSchema): NormalizedSchema {
  const projectDirectory = `${kebabify(domainName)}/${options.subDomainName}/${options.libName}`;
  const projectName = options.libName;
  const projectRoot = `${getWorkspaceLayout(tree).libsDir}/${projectDirectory}`;

  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory,
  };
}

function addFiles(tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.libName),
    fileName: options.projectName,
    offsetFromRoot: offsetFromRoot(options.projectRoot),
    template: '',
  };
  generateFiles(tree, path.join(__dirname, 'files'), options.projectRoot, templateOptions);
}

const domainName = 'shared';

export default async function (tree: Tree, options: SharedGeneratorSchema) {
  // Generate standard lib
  const sourceTags = generateSourceTagsShared(domainName, options.subDomainName, options.libName);
  await libraryGenerator(tree, {
    buildable: true,
    name: options.libName,
    skipModule: true,
    directory: `${domainName}/${options.subDomainName}`,
    tags: Object.values(sourceTags).join(),
  });

  // Parse optional allowed subdomains provided by user
  const allowedSubDomainsUserInputKebab: string[] = options.allowedSubDomains
    ? options.allowedSubDomains
        .split(',')
        .map((str) => str.replace(' ', ''))
        .map((str) => kebabify(str))
    : [];

  // Update tags and set rules
  const tagsGeneratorOptions: TagsGeneratorOptionsShared = {
    allowedSubDomainsInShared: ['util', 'models', ...allowedSubDomainsUserInputKebab],
    domainName,
    subDomainName: options.subDomainName,
    libName: options.libName,
  };
  await tagsGenerator(tree, tagsGeneratorOptions);

  // Add template files
  const normalizedOptions = normalizeOptions(tree, options);
  addFiles(tree, normalizedOptions);

  // Prune compileroptions from the new tsconfig
  pruneCompilerOptions(tree, normalizedOptions.projectRoot);

  await formatFiles(tree);
}

import { libraryGenerator } from '@nrwl/angular/generators';
import { formatFiles, generateFiles, getWorkspaceLayout, names, offsetFromRoot, Tree, } from '@nrwl/devkit';
import * as path from 'path';
import { kebabify } from '../../utils/naming';
import { pruneCompilerOptions } from '../../utils/pruneCompilerOptions';
import { generateTags } from '../../utils/tags.util';
import { SharedGeneratorSchema } from './schema';

interface NormalizedSchema extends SharedGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
}

function normalizeOptions(tree: Tree, options: SharedGeneratorSchema): NormalizedSchema {
  const projectDirectory = `${options.superDomainName}/${kebabify(domainName)}/${
    options.subDomainName
  }/${options.libName}`;
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
  generateFiles(
    tree,
    path.join(__dirname, 'files'),
    options.projectRoot,
    templateOptions
  );
}

const domainName = 'shared';

export default async function (tree: Tree, options: SharedGeneratorSchema) {
  // Generate standard lib
  const tags = generateTags({
    types: [ "lib" ],
    scopes: [ options.superDomainName, domainName, options.subDomainName ]
  })

  await libraryGenerator(tree, {
    buildable: true,
    name: options.libName,
    skipModule: true,
    directory: `${options.superDomainName}/${domainName}/${options.subDomainName}`,
    tags
  });

  // Add template files
  const normalizedOptions = normalizeOptions(tree, options);
  addFiles(tree, normalizedOptions);

  // Prune compileroptions from the new tsconfig
  pruneCompilerOptions(tree, normalizedOptions.projectRoot);

  await formatFiles(tree);
}

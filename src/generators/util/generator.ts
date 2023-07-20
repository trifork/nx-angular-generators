import { libraryGenerator } from '@nrwl/angular/generators';
import { formatFiles, generateFiles, getWorkspaceLayout, names, offsetFromRoot, Tree, } from '@nrwl/devkit';
import * as path from 'path';
import { formatCapitalizations, kebabify } from '../../utils/naming';
import { pruneCompilerOptions } from '../../utils/pruneCompilerOptions';
import { UtilGeneratorSchema } from './schema';
import { generateTags } from "../../utils/tags.util";

interface NormalizedSchema extends UtilGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
}

function normalizeOptions(tree: Tree, options: UtilGeneratorSchema): NormalizedSchema {
  const projectDirectory = `${kebabify(options.superDomainName)}/${kebabify(
    options.domainName
  )}/${libType}`;
  const projectName = libType;
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
    ...names(libType),
    fileName: options.projectName,
    ...formatCapitalizations(options.domainName, true),
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

const libType = 'util';

export default async function (tree: Tree, options: UtilGeneratorSchema) {
  // Generate standard lib
  const tags = generateTags({
    types: [ "lib", libType ],
    scopes: [ options.superDomainName, options.domainName ]
  })
  await libraryGenerator(tree, {
    buildable: true,
    name: libType,
    skipModule: true,
    directory: `${options.superDomainName}/${options.domainName}`,
    tags
  });

  // Add template files
  const normalizedOptions = normalizeOptions(tree, options);
  addFiles(tree, normalizedOptions);

  // Prune compileroptions from the new tsconfig
  pruneCompilerOptions(tree, normalizedOptions.projectRoot);

  await formatFiles(tree);
}

import { componentGenerator, libraryGenerator } from '@nrwl/angular/generators';
import {
  convertNxGenerator,
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  getWorkspacePath,
  names,
  offsetFromRoot,
  Tree,
  updateJson,
  workspaceRoot,
} from '@nrwl/devkit';
import {
  scssGenerator,
  configurationGenerator as stylelintConfigGenerator,
} from 'nx-stylelint';
import { kebabify } from '../../utils/naming';
import { pruneCompilerOptions } from '../../utils/pruneCompilerOptions';
import { generateSourceTagsGeneric, tagsGenerator } from '../tags/generator';
import { ComponentGeneratorSchema } from './schema';
import { changeEslintPrefix } from '../../utils/changeEslintPrefix';
import path = require('path');
import { Schema } from '@nrwl/angular/src/generators/component/schema';
import { writeFileSync, readFileSync } from 'fs';

interface CompleteOptionsGeneric
  extends Required<Omit<ComponentGeneratorSchema, 'subDomainName'>> {
  // Null if called with all options, where cwd parsing is not applicable
  cwdOffsetFromProject: string | null;
  componentOutPutRelativeToProject: string;
}

interface CompleteOptionsShared extends Required<ComponentGeneratorSchema> {
  // Null if called with all options, where cwd parsing is not applicable
  cwdOffsetFromProject: string | null;
  componentOutPutRelativeToProject: string;
}

function isSharedOptions(
  options: CompleteOptionsGeneric | CompleteOptionsShared
): options is CompleteOptionsShared {
  return (
    (options as CompleteOptionsShared).subDomainName !== undefined &&
    (options as CompleteOptionsShared).subDomainName !== ''
  );
}

type NormalizedSchema = (CompleteOptionsGeneric | CompleteOptionsShared) & {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
};

function normalizeOptions(
  tree: Tree,
  options: CompleteOptionsGeneric | CompleteOptionsShared
): NormalizedSchema {
  const { domainName, libName, superDomainName } = options;
  const projectDirectory = `${kebabify(options.superDomainName)}/${kebabify(domainName)}${
    isSharedOptions(options) ? '/' + kebabify(options.subDomainName) : ''
  }/${options.libName}`;
  const projectRoot = `${getWorkspaceLayout(tree).libsDir}/${projectDirectory}`;
  const projectName = isSharedOptions(options)
    ? `${superDomainName}-${domainName}-${options.subDomainName}-${libName}`
    : `${superDomainName}-${domainName}-${libName}`;

  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory,
  };
}

function optionsAreComplete(options: ComponentGeneratorSchema) {
  return !!options.domainName && !!options.libName && !!options.superDomainName;
}

function getSuperDomainFromPath(path: string) {
  const superDomain = path.split(workspaceRoot)[1].split('/')[2];
  return superDomain;
}

function getDomainFromPath(path: string) {
  const domain = path.split(workspaceRoot)[1].split('/')[3];
  return domain;
}

function getLibFromPath(path: string, isInSharedDomain: boolean) {
  const lib = path.split(workspaceRoot)[1].split('/')[isInSharedDomain ? 5 : 4];
  return lib;
}

function getSubDomainFromPath(path: string) {
  const subdomain = path.split(workspaceRoot)[1].split('/')[4];
  return subdomain;
}

function getProjectOffsetFromPath(path: string, isInSharedDomain: boolean) {
  let offset = '';
  const lib = getLibFromPath(path, isInSharedDomain);
  try {
    offset = path.split(workspaceRoot)[1].split(lib)[1].substring(1);
  } catch {
    // eslint-disable-next-line no-console
    console.log("Could not get project offset, defaulting to ''");
  }
  return offset;
}

function parseStructureFromWorkingDirectory() {
  if (process.env['INIT_CWD'] === undefined || process.env['INIT_CWD'] === '')
    throw new Error('Can not find component out path');

  // Derive working dir from env variable
  const pathToComponentOutput = process.env['INIT_CWD'];

  // Parse domain etc. from the path above if not supplied
  const superDomainName = getSuperDomainFromPath(pathToComponentOutput);
  const domainName = getDomainFromPath(pathToComponentOutput);
  const isInSharedDomain = domainName === 'shared';
  const subDomainName = isInSharedDomain
    ? getSubDomainFromPath(pathToComponentOutput)
    : undefined;
  const libName = getLibFromPath(pathToComponentOutput, isInSharedDomain);
  const cwdOffsetFromProject = getProjectOffsetFromPath(
    pathToComponentOutput,
    isInSharedDomain
  );
  if (superDomainName === '' || domainName === '' || libName === '')
    throw new Error('Parse error');
  if (isInSharedDomain) {
    console.log(
      'Deriving superdomain, subdomain, domain, libname and offset from working directory: ',
      superDomainName,
      domainName,
      subDomainName,
      libName,
      cwdOffsetFromProject
    );
  } else {
    console.log(
      'Deriving superdomain, domain, libname and offset from working directory: ',
      superDomainName,
      domainName,
      libName,
      cwdOffsetFromProject
    );
  }

  return isInSharedDomain
    ? ({
        superDomainName,
        domainName,
        subDomainName,
        libName,
        cwdOffsetFromProject,
        componentOutPutRelativeToProject: cwdOffsetFromProject,
      } as Omit<CompleteOptionsShared, 'componentName'>)
    : ({
        superDomainName,
        domainName,
        libName,
        cwdOffsetFromProject,
        componentOutPutRelativeToProject: cwdOffsetFromProject,
      } as Omit<CompleteOptionsGeneric, 'componentName'>);
}

function shouldBeExported(completeOptions: CompleteOptionsGeneric) {
  return (
    completeOptions.libName == 'ui' ||
    completeOptions.domainName === 'shared' ||
    completeOptions.superDomainName === 'shared'
  );
}

function addExport(
  completeOptions: CompleteOptionsGeneric | CompleteOptionsShared,
  tree: Tree,
  normalizedOptions: NormalizedSchema
) {
  const path = normalizedOptions.projectRoot + '/src/index.ts';
  if (!tree.exists(path)) throw new Error('Could not find index.ts');
  const oldIndexTS = tree.read(path)!.toString();
  const newIndexTS = `${oldIndexTS}\nexport * from './${
    completeOptions.cwdOffsetFromProject?.split('src/')[1]
  }/${completeOptions.componentName}/${completeOptions.componentName}.component'`;
  tree.write(path, newIndexTS);
}

function componentAllowedOnPath(completeOptions: CompleteOptionsGeneric) {
  return (
    completeOptions.libName === 'ui' ||
    completeOptions.libName.includes('feature') ||
    completeOptions.domainName === 'shared' ||
    completeOptions.superDomainName === 'shared'
  );
}

export default async function (
  tree: Tree,
  options: ComponentGeneratorSchema,
  minimalInteractive = false
) {
  // Establish options
  let completeOptions: CompleteOptionsGeneric | CompleteOptionsShared;
  if (!optionsAreComplete(options) || minimalInteractive) {
    completeOptions = {
      ...parseStructureFromWorkingDirectory(),
      componentName: options.componentName,
    };
  } else {
    completeOptions = {
      ...(options as Required<ComponentGeneratorSchema>),
      cwdOffsetFromProject: null,
      componentOutPutRelativeToProject: '/src/lib/components/' + options.componentName,
    };
  }

  // Safeguard component generation in unwanted places
  if (!componentAllowedOnPath(completeOptions))
    throw new Error(
      'Not a good spot for a component! In a generic domain, components must be in ui lib or feature lib'
    );

  // Run generator with options
  const normalizedOptions = normalizeOptions(tree, completeOptions);

  const angularGeneratorOptions: Schema = {
    name: normalizedOptions.componentName,
    project: normalizedOptions.projectName,
    path:
      normalizedOptions.projectRoot +
      '/' +
      normalizedOptions.componentOutPutRelativeToProject,
    standalone: true,
    displayBlock: true,
    style: 'scss',
    prefix:
      normalizedOptions.superDomainName === 'shared'
        ? 'sam-'
        : normalizedOptions.superDomainName,
  };
  // This usage generates warning, that it should be wrapped in
  // callRule. This is not possible atm. bc. of unaligned type Tree
  // between the @angular-devkit/schematics package and @nrwl/devkit
  // TODO: should be checked later, when packages are upgraded

  await componentGenerator(tree, angularGeneratorOptions);

  if (shouldBeExported(completeOptions))
    addExport(completeOptions, tree, normalizedOptions);
  await formatFiles(tree);
}

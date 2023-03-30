import { libraryGenerator } from "@nrwl/angular/generators";
import { formatFiles, getWorkspaceLayout, Tree } from "@nrwl/devkit";
import {
  scssGenerator,
  configurationGenerator as stylelintConfigGenerator,
} from "nx-stylelint";
import { kebabify } from "../../utils/naming";
import { pruneCompilerOptions } from "../../utils/pruneCompilerOptions";
import { generateSourceTagsGeneric, tagsGenerator } from "../tags/generator";
import { UIGeneratorSchema } from "./schema";

interface NormalizedSchema extends UIGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
}

function normalizeOptions(
  tree: Tree,
  options: UIGeneratorSchema
): NormalizedSchema {
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

const libType = "ui";

export default async function (tree: Tree, options: UIGeneratorSchema) {
  const { domainName } = options;
  const libName = `${domainName}-${libType}`;
  // Generate standard lib
  const sourceTags = generateSourceTagsGeneric(
    options.superDomainName,
    domainName,
    libType
  );
  await libraryGenerator(tree, {
    buildable: true,
    name: libType,
    standalone: true,
    displayBlock: true,
    style: "scss",
    simpleName: true,
    directory: domainName,
    tags: Object.values(sourceTags).join(),
  });

  // Generate stylelint
  await stylelintConfigGenerator(tree, {
    project: libName,
    skipFormat: false,
    formatter: "string",
  });

  // Generate scss
  await scssGenerator(tree, {
    project: libName,
    skipFormat: false,
  });

  // Update tags and set rules
  await tagsGenerator(tree, {
    superDomainName: options.superDomainName,
    allowedSubDomainsInShared: ["ui"],
    allowedLibTypesInDomain: ["util", "models"],
    domainName: options.domainName,
    libType,
  });

  // Add template files
  const normalizedOptions = normalizeOptions(tree, options);

  // Prune compileroptions from the new tsconfig
  pruneCompilerOptions(tree, normalizedOptions.projectRoot);

  await formatFiles(tree);
}

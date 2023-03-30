import { libraryGenerator } from "@nrwl/angular/generators";
import { formatFiles, getWorkspaceLayout, Tree } from "@nrwl/devkit";
import {
  scssGenerator,
  configurationGenerator as stylelintConfigGenerator,
} from "nx-stylelint";
import { kebabify } from "../../utils/naming";
import { pruneCompilerOptions } from "../../utils/pruneCompilerOptions";
import { generateSourceTagsGeneric, tagsGenerator } from "../tags/generator";
import { FeatureGeneratorSchema } from "./schema";

interface NormalizedSchema extends FeatureGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
}

function normalizeOptions(
  tree: Tree,
  options: FeatureGeneratorSchema
): NormalizedSchema {
  const { domainName, featureName } = options;
  const projectDirectory = `${kebabify(options.superDomainName)}/${kebabify(
    domainName
  )}/${libType}-${featureName}`;
  const projectName = libType;
  const projectRoot = `${getWorkspaceLayout(tree).libsDir}/${projectDirectory}`;

  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory,
  };
}

const libType = "feature";

export default async function (tree: Tree, options: FeatureGeneratorSchema) {
  const normalizedOptions = normalizeOptions(tree, options);
  const { superDomainName, featureName, domainName, projectRoot } =
    normalizedOptions;
  const libName = `${superDomainName}-${domainName}-${libType}-${featureName}`;

  // Generate standard lib
  const sourceTags = generateSourceTagsGeneric(
    domainName,
    libType,
    featureName
  );
  await libraryGenerator(tree, {
    buildable: true,
    name: `${libType}-${featureName}`,
    standalone: true,
    routing: true,
    lazy: true,
    displayBlock: true,
    style: "scss",
    simpleName: true,
    directory: domainName,
    tags: Object.values(sourceTags).join(),
  });

  //   // Generate stylelint
  //   await stylelintConfigGenerator(tree, {
  //     project: libName,
  //     skipFormat: false,
  //     formatter: "string",
  //   });

  //   // Generate scss
  //   await scssGenerator(tree, {
  //     project: libName,
  //     skipFormat: false,
  //   });

  // Update tags and set rules
  await tagsGenerator(tree, {
    superDomainName: options.superDomainName,
    allowedSubDomainsInShared: [],
    allOfSharedAllowed: true,
    allowedLibTypesInDomain: ["models", "state", "ui", "util"],
    domainName,
    libType,
    libName: featureName,
  });

  // Prune compileroptions from the new tsconfig
  pruneCompilerOptions(tree, projectRoot);

  await formatFiles(tree);
}

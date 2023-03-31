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
import { changeEslintPrefix } from "../../utils/changeEslintPrefix";

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
  const normalizedOptions = normalizeOptions(tree, options);
  const { projectName, domainName, projectRoot, superDomainName } =
    normalizedOptions;
  const fullResultingProjectName = `${superDomainName}-${domainName}-${libType}`;
  // Generate standard lib
  const sourceTags = generateSourceTagsGeneric(
    superDomainName,
    domainName,
    libType
  );
  const selectorPrefix = kebabify(superDomainName);

  await libraryGenerator(tree, {
    selector: `${selectorPrefix}-rename-this`,
    buildable: true,
    name: projectName,
    standalone: true,
    displayBlock: true,
    style: "scss",
    simpleName: true,
    directory: superDomainName + "/" + domainName,
    tags: Object.values(sourceTags).join(),
  });

  // Generate stylelint
  await stylelintConfigGenerator(tree, {
    project: fullResultingProjectName,
    skipFormat: false,
    formatter: "string",
  });

  // Generate scss
  await scssGenerator(tree, {
    project: fullResultingProjectName,
    skipFormat: false,
  });

  // Update tags and set rules
  await tagsGenerator(tree, {
    superDomainName: superDomainName,
    allowedSubDomainsInShared: ["ui"],
    allowedLibTypesInDomain: ["util", "models"],
    domainName: domainName,
    libType,
  });

  // Prune compileroptions from the new tsconfig
  await pruneCompilerOptions(tree, projectRoot);
  await changeEslintPrefix(tree, projectRoot, selectorPrefix);

  await formatFiles(tree);
}

import { libraryGenerator } from "@nrwl/angular/generators";
import {
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  names,
  offsetFromRoot,
  ProjectConfiguration,
  readProjectConfiguration,
  Target,
  TargetConfiguration,
  Tree,
  updateProjectConfiguration,
} from "@nrwl/devkit";
import * as path from "path";
import { formatCapitalizations, kebabify } from "../../utils/naming";
import { pruneCompilerOptions } from "../../utils/pruneCompilerOptions";
import { generateSourceTagsGeneric, tagsGenerator } from "../tags/generator";
import { DataAccessGeneratorSchema } from "./schema";

interface NormalizedSchema extends DataAccessGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
}

function normalizeOptions(
  tree: Tree,
  options: DataAccessGeneratorSchema
): NormalizedSchema {
  const projectDirectory = `${kebabify(options.superDomainName)}/${kebabify(
    options.domainName
  )}/${kebabify(libType)}`;
  // This will not be the actual project name in project.json
  // the ladder will be prepended with <superdomaian>-<domain>-
  const projectName = kebabify(libType);
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
    template: "",
  };
  generateFiles(
    tree,
    path.join(__dirname, "files"),
    options.projectRoot,
    templateOptions
  );
}

const libType = "data_access";

export default async function (tree: Tree, options: DataAccessGeneratorSchema) {
  // Generate standard lib
  const sourceTags = generateSourceTagsGeneric(
    options.superDomainName,
    options.domainName,
    libType
  );
  await libraryGenerator(tree, {
    buildable: true,
    name: libType,
    skipModule: true,
    directory:
      kebabify(options.superDomainName) + "/" + kebabify(options.domainName),
    tags: Object.values(sourceTags).join(),
  });

  // Update tags and set rules
  await tagsGenerator(tree, {
    superDomainName: options.superDomainName,
    allowedSubDomainsInShared: ["util", "auth"],
    allowedLibTypesInDomain: ["util", "models"],
    domainName: options.domainName,
    libType,
  });

  // Add template files
  const normalizedOptions = normalizeOptions(tree, options);
  const projectJSONNameField = `${kebabify(options.superDomainName)}-${kebabify(
    options.domainName
  )}-${normalizedOptions.projectName}`;
  // TODO: after unit testing is implemented, try and clean up naming variables
  addFiles(tree, normalizedOptions);

  // Add graphql generation target
  const targetConfiguration: TargetConfiguration = {
    executor: "@nrwl/workspace:run-commands",
    options: {
      commands: [
        {
          // TODO: {projectRoot} used directly in command, is not supported
          // might be in the future
          command: 'yarn graphql-codegen --config="$CODEGEN_CONFIG_PATH"',
        },
      ],
    },
  };
  const projectConfiguration = readProjectConfiguration(
    tree,
    projectJSONNameField
  );
  if (!projectConfiguration.hasOwnProperty("targets"))
    projectConfiguration.targets = {};
  projectConfiguration.targets!["generate-graphql"] = targetConfiguration;
  updateProjectConfiguration(
    tree,
    normalizedOptions.projectName,
    projectConfiguration
  );

  // Prune compileroptions from the new tsconfig
  pruneCompilerOptions(tree, normalizedOptions.projectRoot);

  await formatFiles(tree);
}

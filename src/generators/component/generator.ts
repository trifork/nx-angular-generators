import { libraryGenerator } from "@nrwl/angular/generators";
import {
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  getWorkspacePath,
  names,
  offsetFromRoot,
  Tree,
  workspaceRoot,
} from "@nrwl/devkit";
import {
  scssGenerator,
  configurationGenerator as stylelintConfigGenerator,
} from "nx-stylelint";
import { kebabify } from "../../utils/naming";
import { pruneCompilerOptions } from "../../utils/pruneCompilerOptions";
import { generateSourceTagsGeneric, tagsGenerator } from "../tags/generator";
import { FeatureGeneratorSchema } from "./schema";
import { changeEslintPrefix } from "../../utils/changeEslintPrefix";
import path = require("path");

interface NormalizedSchema extends Required<FeatureGeneratorSchema> {
  projectRoot: string;
  projectDirectory: string;
}

function normalizeOptions(
  tree: Tree,
  options: Required<FeatureGeneratorSchema>,
  offsetFromProject: String
): NormalizedSchema {
  const { domainName, componentName, libName, superDomainName } = options;
  const projectDirectory = `${kebabify(options.superDomainName)}/${kebabify(
    domainName
  )}/${options.libName}`;
  const projectRoot = `${getWorkspaceLayout(tree).libsDir}/${projectDirectory}`;

  return {
    ...options,
    projectRoot,
    projectDirectory,
  };
}

function addFiles(tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
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

function optionsAreComplete(options: FeatureGeneratorSchema) {
  return !!options.domainName && !!options.libName && !!options.superDomainName;
}

function getSuperDomainFromPath(path: string) {
  const superDomain = path.split(workspaceRoot)[1].split("/")[2];
  console.log("Deriving superdomain from working directory: ", superDomain);
  return superDomain;
}

function getDomainFromPath(path: string) {
  const domain = path.split(workspaceRoot)[1].split("/")[3];
  console.log("Deriving domain from working directory: ", domain);
  return domain;
}

function getLibFromPath(path: string) {
  const lib = path.split(workspaceRoot)[1].split("/")[4];
  console.log("Deriving lib from working directory: ", lib);
  return lib;
}

function parseStructureFromWorkingDirectory() {
  if (process.env["INIT_CWD"] === undefined || process.env["INIT_CWD"] === "")
    throw new Error("Can not find component out path");

  // Derive working dir from env variable
  const pathToComponentOutput = process.env["INIT_CWD"];

  // Parse domain etc. from the path above if not supplied
  const superDomainName = getSuperDomainFromPath(pathToComponentOutput);
  const domainName = getDomainFromPath(pathToComponentOutput);
  const libName = getLibFromPath(pathToComponentOutput);
  if (superDomainName === "" || domainName === "" || libName === "")
    throw new Error("Parse error");

  return { superDomainName, domainName, libName };
}

export default async function (tree: Tree, options: FeatureGeneratorSchema) {
  // Establish options
  let completeOptions: Required<FeatureGeneratorSchema>;
  if (!optionsAreComplete(options)) {
    completeOptions = {
      ...parseStructureFromWorkingDirectory(),
      componentName: options.componentName,
    };
  } else {
    completeOptions = options as Required<FeatureGeneratorSchema>;
  }
  const offsetFromProjectRoot = "/src/lib/components";

  // eslint-disable-next-line no-console
  console.log("Generating component in:", offsetFromProjectRoot);

  // Add template files
  const normalizedOptions = normalizeOptions(
    tree,
    completeOptions,
    offsetFromProjectRoot
  );
  // TODO: after unit testing is implemented, try and clean up naming variables
  addFiles(tree, normalizedOptions);

  //   await formatFiles(tree);
}

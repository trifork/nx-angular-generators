import { componentGenerator, libraryGenerator } from "@nrwl/angular/generators";
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
import { Schema } from "@nrwl/angular/src/generators/component/schema";

interface CompleteOptions extends Required<FeatureGeneratorSchema> {
  offsetFromProject: string;
}

interface NormalizedSchema extends CompleteOptions {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
}

function normalizeOptions(
  tree: Tree,
  options: CompleteOptions
): NormalizedSchema {
  const { domainName, libName, superDomainName } = options;
  const projectDirectory = `${kebabify(options.superDomainName)}/${kebabify(
    domainName
  )}/${options.libName}`;
  const projectRoot = `${getWorkspaceLayout(tree).libsDir}/${projectDirectory}`;
  const projectName = `${superDomainName}-${domainName}-${libName}`;

  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory,
  };
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

function getProjectOffsetFromPath(path: string) {
  let offset = "";
  const lib = getLibFromPath(path);
  try {
    offset = path.split(workspaceRoot)[1].split(lib)[1].substring(1);
  } catch {
    // eslint-disable-next-line no-console
    console.log("Could not get project offset, defaulting to ''");
  }
  console.log("Derived project offset from working directory: ", offset);
  return offset;
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
  const offsetFromProject = getProjectOffsetFromPath(pathToComponentOutput);
  if (superDomainName === "" || domainName === "" || libName === "")
    throw new Error("Parse error");

  return { superDomainName, domainName, libName, offsetFromProject };
}

export default async function (tree: Tree, options: FeatureGeneratorSchema) {
  // Establish options
  let completeOptions: CompleteOptions;
  if (!optionsAreComplete(options)) {
    completeOptions = {
      ...parseStructureFromWorkingDirectory(),
      componentName: options.componentName,
    };
  } else {
    completeOptions = {
      ...(options as Required<FeatureGeneratorSchema>),
      offsetFromProject: "/src/lib/components/" + options.componentName,
    };
  }

  // eslint-disable-next-line no-console
  console.log("Generating component in:", completeOptions.offsetFromProject);

  // Run generator with options
  const normalizedOptions = normalizeOptions(tree, completeOptions);
  const angularGeneratorOptions: Schema = {
    name: normalizedOptions.componentName,
    project: normalizedOptions.projectName,
    standalone: true,
    selector: kebabify(normalizedOptions.componentName),
    displayBlock: true,
    style: "scss",
    prefix:
      normalizedOptions.superDomainName === "shared"
        ? "sam-"
        : normalizedOptions.domainName,
  };
  componentGenerator(tree, angularGeneratorOptions);

  //   await formatFiles(tree);
}

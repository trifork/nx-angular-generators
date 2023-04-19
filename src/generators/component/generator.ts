import { componentGenerator, libraryGenerator } from "@nrwl/angular/generators";
import { callRule } from "";
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
import { writeFileSync, readFileSync } from "fs";

interface CompleteOptions extends Required<FeatureGeneratorSchema> {
  // Null if called with all options, where cwd parsing is not applicable
  cwdOffsetFromProject: string | null;
  componentOutPutRelativeToProject: string;
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
  const projectDirectory = `libs/${kebabify(
    options.superDomainName
  )}/${kebabify(domainName)}/${options.libName}`;
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
  return superDomain;
}

function getDomainFromPath(path: string) {
  const domain = path.split(workspaceRoot)[1].split("/")[3];
  return domain;
}

function getLibFromPath(path: string) {
  const lib = path.split(workspaceRoot)[1].split("/")[4];
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
  const cwdOffsetFromProject = getProjectOffsetFromPath(pathToComponentOutput);
  if (superDomainName === "" || domainName === "" || libName === "")
    throw new Error("Parse error");
  console.log(
    "Deriving superdomain, domain, libname and offset from lib directory: ",
    superDomainName,
    domainName,
    libName,
    cwdOffsetFromProject
  );

  return {
    superDomainName,
    domainName,
    libName,
    cwdOffsetFromProject,
    componentOutPutRelativeToProject: cwdOffsetFromProject,
  } as Omit<CompleteOptions, "componentName">;
}

function shouldBeExported(completeOptions: CompleteOptions) {
  return (
    completeOptions.libName == "ui" ||
    completeOptions.domainName === "shared" ||
    completeOptions.superDomainName === "shared"
  );
}

function addExport(
  completeOptions: CompleteOptions,
  tree: Tree,
  normalizedOptions: NormalizedSchema
) {
  const path = normalizedOptions.projectDirectory + "/src/index.ts";
  if (!tree.exists(path)) throw new Error("Could not find index.ts");
  const oldIndexTS = tree.read(path)!.toString();
  const newIndexTS = `${oldIndexTS}\nexport * from './${
    completeOptions.cwdOffsetFromProject?.split("src/")[1]
  }/${completeOptions.componentName}/${
    completeOptions.componentName
  }.component'`;
  tree.write(path, newIndexTS);
}

function componentAllowedOnPath(completeOptions: CompleteOptions) {
  return (
    completeOptions.libName === "ui" ||
    completeOptions.libName.includes("feature") ||
    completeOptions.domainName === "shared" ||
    completeOptions.superDomainName === "shared"
  );
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
      cwdOffsetFromProject: null,
      componentOutPutRelativeToProject:
        "/src/lib/components/" + options.componentName,
    };
  }

  // Safeguard component generation in unwanted places
  if (!componentAllowedOnPath(completeOptions))
    throw new Error(
      "Not a good spot for a component! In a generic domain, components must be in ui lib or feature lib"
    );

  console.log(
    "Generating component in:",
    completeOptions.componentOutPutRelativeToProject
  );

  // Run generator with options
  const normalizedOptions = normalizeOptions(tree, completeOptions);
  const angularGeneratorOptions: Schema = {
    name: normalizedOptions.componentName,
    project: normalizedOptions.projectName,
    standalone: true,
    displayBlock: true,
    style: "scss",
    prefix:
      normalizedOptions.superDomainName === "shared"
        ? "sam-"
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

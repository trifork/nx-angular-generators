/* eslint-disable no-console */
import { readJsonFile, Tree, writeJsonFile } from '@nrwl/devkit';
import { kebabify } from '../../utils/naming';
import {
  AllowedLibsInDomainTagCollection,
  isShared as isSharedDomainOptions,
  SourceTagCollectionGeneric,
  SourceTagCollectionShared,
  TagsGeneratorOptionsGeneric,
  TagsGeneratorOptionsShared,
} from './generator.model';

// Tags to be set on the lib itself (package.json)
export function generateSourceTagsGeneric(domainName: string, libType: string, libName?: string): SourceTagCollectionGeneric {
  const returnVar: SourceTagCollectionGeneric = {
    domain: `scope:${kebabify(domainName)}`,
    domainAndLib: `scope:${kebabify(domainName)}-${kebabify(libType)}`,
  };
  if (libName) returnVar.domainLibAndName = `scope:${kebabify(domainName)}-${kebabify(libType)}-${kebabify(libName)}`;
  return returnVar;
}
export function generateSourceTagsShared(
  domainName: 'shared',
  subDomainName: string,
  libName: string
): SourceTagCollectionShared {
  return {
    domain: `scope:${kebabify(domainName)}`,
    domainAndSubDomain: `scope:${kebabify(domainName)}-${kebabify(subDomainName)}`,
    domainSubDomainAndName: `scope:${kebabify(domainName)}-${kebabify(subDomainName)}-${kebabify(libName)}`,
  };
}

function generateAllowedTagCombinationsGeneric(options: TagsGeneratorOptionsGeneric): string[] {
  const allowedLibsInDomain: Partial<AllowedLibsInDomainTagCollection> = {};
  const genericDomainKebab = kebabify(options.domainName);
  options.allowedLibTypesInDomain.forEach((libType) => {
    const libKebab = kebabify(libType);
    allowedLibsInDomain[libType] = `${genericDomainKebab}-${libKebab}`;
  });
  return Object.values(allowedLibsInDomain);
}

// Tags needed to be present on imported libs
function generateAllowedTagCombinations(options: TagsGeneratorOptionsGeneric | TagsGeneratorOptionsShared): string[] {
  // Construct same-domain-tags if the created lib is not in shared itself
  const sameDomainTagsAllowed = isSharedDomainOptions(options) ? [] : generateAllowedTagCombinationsGeneric(options);

  // Construct shared tags, add all of shared, if specified in options
  const sharedTagsAllowed: string[] = !isSharedDomainOptions(options) && options.allOfSharedAllowed ? ['shared'] : [];
  options.allowedSubDomainsInShared.forEach((subdomain) => {
    const domain = 'shared';
    const subDomainKebab = kebabify(subdomain);
    sharedTagsAllowed.push(`${domain}-${subDomainKebab}`);
  });
  return [...sameDomainTagsAllowed, ...sharedTagsAllowed].map((tag) => `scope:${tag}`);
}

export default async function () {
  throw new Error('Should not be called from CLI');
}

// Partial types for the JSON imported from .eslintrc.json
type ruleConfig = [string, { allow: string[]; depConstraints: { sourceTag: string; onlyDependOnLibsWithTags: string[] }[] }];
interface eslintJSON {
  overrides?: {
    files: string[];
    rules: { '@nrwl/nx/enforce-module-boundaries'?: ruleConfig };
  }[];
}

export async function tagsGenerator(tree: Tree, options: TagsGeneratorOptionsGeneric | TagsGeneratorOptionsShared) {
  // Detect dry run
  const dryRun = process.argv.includes('--dryRun') || process.argv.includes('--dry-run');

  // Generate source tags
  let mostSpecificSourceTag: string;

  if (isSharedDomainOptions(options)) {
    const sourceTagsCollection = generateSourceTagsShared(options.domainName, options.subDomainName, options.libName);
    mostSpecificSourceTag = sourceTagsCollection.domainSubDomainAndName;
  } else {
    const sourceTagsCollection = generateSourceTagsGeneric(options.domainName, options.libType, options.libName);
    mostSpecificSourceTag = sourceTagsCollection.domainLibAndName || sourceTagsCollection.domainAndLib;
  }

  // Generate allowed tags
  const allowedTags = generateAllowedTagCombinations(options);

  // Add rules to existing .eslintrc
  const eslintPath = `${tree.root}/.eslintrc.json`;
  const existingEslintConfig: eslintJSON = await readJsonFile(eslintPath);

  try {
    // Get the existing ts rules

    const overrides = existingEslintConfig.overrides;
    const tsOverrideObjs = overrides?.filter((overrideObj) => {
      return overrideObj.files.includes('*.ts');
    });
    if (!Array.isArray(tsOverrideObjs) || tsOverrideObjs.length !== 1)
      throw new Error('More or less than one ts override obj. in root eslintrc.json');
    const tsOverrideObj = tsOverrideObjs[0];
    const moduleBounds = tsOverrideObj.rules['@nrwl/nx/enforce-module-boundaries'];
    if (!moduleBounds) throw new Error('Could not find module rules in root eslintrc.json');
    const existingDepConstraints = moduleBounds[1].depConstraints;

    // Generate new rules
    const depConstraintToBeAdded = {
      sourceTag: mostSpecificSourceTag,
      onlyDependOnLibsWithTags: Object.values(allowedTags),
    };
    const newBounds: ruleConfig = [
      'error',
      {
        allow: [],
        depConstraints:
          existingDepConstraints && Array.isArray(existingDepConstraints)
            ? [...existingDepConstraints, depConstraintToBeAdded]
            : [depConstraintToBeAdded],
      },
    ];

    // Output rule to console
    if (allowedTags.length >= 1) {
      console.log(`ADDED RULE to root .eslintrc.json, that tag '${mostSpecificSourceTag}' can only depend on tags:`);
      Object.values(allowedTags).forEach((tag) => {
        console.log(tag);
      });
    }

    // Mutate eslint object
    tsOverrideObj.rules['@nrwl/nx/enforce-module-boundaries'] = newBounds;

    // Overwrite old .eslintrc.json
    if (!dryRun) writeJsonFile(eslintPath, existingEslintConfig);
  } catch (err) {
    console.error('Error setting dependency rules in lib', err);
  }
}

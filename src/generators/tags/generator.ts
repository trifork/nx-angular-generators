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
import { eslintJSON, moduleBoundsRuleConfig } from 'src/utils/changeEslintPrefix';

// Tags to be set on the lib itself (package.json)
export function generateSourceTags(args: {  types: string[], scopes: string[] }) {
  const { types = [], scopes = []} = args;

  const typesMapped = types.map(type => `type:${kebabify(type)}`);
  const scopesMapped = scopes.map(scope => `scope:${kebabify(scope)}`)

  return { ...typesMapped, ...scopesMapped}.join(", ");
}
export function generateSourceTagsGeneric(
  superDomainName: string,
  domainName: string,
  libType: string,
  libName?: string
): SourceTagCollectionGeneric {
  const returnVar: SourceTagCollectionGeneric = {
    superDomain: `scope:${kebabify(superDomainName)}`,
    superDomainAndDomain: `scope:${kebabify(superDomainName)}-${kebabify(domainName)}`,
    superDomainDomainAndLib: `scope:${kebabify(superDomainName)}-${kebabify(
      domainName
    )}-${kebabify(libType)}`,
  };
  if (libName)
    returnVar.superDomainDomainLibAndName = `scope:${kebabify(
      superDomainName
    )}-${kebabify(domainName)}-${kebabify(libType)}-${kebabify(libName)}`;
  return returnVar;
}
export function generateSourceTagsShared(
  superDomain: string,
  domainName: 'shared',
  subDomainName: string,
  libName: string
): SourceTagCollectionShared {
  return {
    superDomain: `scope:${kebabify(superDomain)}`,
    superDomainAndDomain: `scope:${kebabify(superDomain)}-${kebabify(domainName)}`,
    superDomainDomainAndSubDomain: `scope:${kebabify(superDomain)}-${kebabify(
      domainName
    )}-${kebabify(subDomainName)}`,
    superDomainDomainSubDomainAndName: `scope:${kebabify(superDomain)}-${kebabify(
      domainName
    )}-${kebabify(subDomainName)}-${kebabify(libName)}`,
  };
}

function generateAllowedTagCombinationsGeneric(
  options: TagsGeneratorOptionsGeneric
): string[] {
  const allowedLibsInDomain: Partial<AllowedLibsInDomainTagCollection> = {};
  const genericDomainKebab = kebabify(options.domainName);
  const genericSuperDomainKebab = kebabify(options.superDomainName);
  options.allowedLibTypesInDomain.forEach((libType) => {
    const libKebab = kebabify(libType);
    allowedLibsInDomain[
      libType
    ] = `${genericSuperDomainKebab}-${genericDomainKebab}-${libKebab}`;
  });
  return Object.values(allowedLibsInDomain);
}

// Tags needed to be present on imported libs
function generateAllowedTagCombinations(
  options: TagsGeneratorOptionsGeneric | TagsGeneratorOptionsShared
): string[] {
  // Construct same-domain-tags if the created lib is not in shared itself
  const sameDomainTagsAllowed = isSharedDomainOptions(options)
    ? []
    : generateAllowedTagCombinationsGeneric(options);

  // Construct shared tags, add all of shared, if specified in options
  const sharedTagsAllowed: string[] =
    !isSharedDomainOptions(options) && options.allOfSharedAllowed
      ? [options.superDomainName + '-shared']
      : [];
  options.allowedSubDomainsInShared.forEach((subdomain) => {
    const domain = 'shared';
    const superDomain = options.superDomainName;
    const subDomainKebab = kebabify(subdomain);
    sharedTagsAllowed.push(`${superDomain}-${domain}-${subDomainKebab}`);
  });
  return [...sameDomainTagsAllowed, ...sharedTagsAllowed].map((tag) => `scope:${tag}`);
}

export default async function () {
  throw new Error('Should not be called from CLI');
}

// Partial types for the JSON imported from .eslintrc.json

export async function tagsGenerator(
  tree: Tree,
  options: TagsGeneratorOptionsGeneric | TagsGeneratorOptionsShared
) {
  // Detect dry run
  const dryRun = process.argv.includes('--dryRun') || process.argv.includes('--dry-run');

  // Generate source tags
  let mostSpecificSourceTag: string;

  if (isSharedDomainOptions(options)) {
    const sourceTagsCollection = generateSourceTagsShared(
      options.superDomainName,
      options.domainName,
      options.subDomainName,
      options.libName
    );
    mostSpecificSourceTag = sourceTagsCollection.superDomainDomainSubDomainAndName;
  } else {
    const sourceTagsCollection = generateSourceTagsGeneric(
      options.superDomainName,
      options.domainName,
      options.libType,
      options.libName
    );
    mostSpecificSourceTag =
      sourceTagsCollection.superDomainDomainLibAndName ||
      sourceTagsCollection.superDomainDomainAndLib;
  }

  // Generate allowed tags
  const allowedTags = generateAllowedTagCombinations(options);

  // Add rules to existing .eslintrc
  const eslintPath = `${tree.root}/.eslintrc.base.json`;
  const existingEslintConfig: eslintJSON = await readJsonFile(eslintPath);

  try {
    // Get the existing ts rules

    const overrides = existingEslintConfig.overrides;
    const tsOverrideObjs = overrides?.filter((overrideObj) => {
      return '@nrwl/nx/enforce-module-boundaries' in overrideObj.rules;
    });
    if (!Array.isArray(tsOverrideObjs) || tsOverrideObjs.length !== 1)
      throw new Error('More or less than one ts override obj. in root eslintrc.json');
    const tsOverrideObj = tsOverrideObjs[0];
    const moduleBounds = tsOverrideObj.rules['@nrwl/nx/enforce-module-boundaries'];
    if (!moduleBounds)
      throw new Error('Could not find module rules in root eslintrc.json');
    const existingDepConstraints = moduleBounds[1].depConstraints;

    // Generate new rules
    const depConstraintToBeAdded = {
      sourceTag: mostSpecificSourceTag,
      onlyDependOnLibsWithTags: Object.values(allowedTags),
    };
    const newBounds: moduleBoundsRuleConfig = [
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
      console.log(
        `ADDED RULE to root .eslintrc.base.json, that tag '${mostSpecificSourceTag}' can only depend on tags:`
      );
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

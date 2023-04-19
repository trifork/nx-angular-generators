// All other domains than shared (no subdomains allowed)
export interface TagsGeneratorOptionsGeneric {
  superDomainName: string;
  domainName: string;
  libType: LibTypesStr;
  libName?: string;
  allowedLibTypesInDomain: LibTypesStr[];
  allowedSubDomainsInShared: string[];
  allOfSharedAllowed?: boolean;
}

export interface TagsGeneratorOptionsShared {
  superDomainName: string;
  domainName: 'shared';
  subDomainName: string;
  libName: string;
  allowedSubDomainsInShared: string[];
}

export function isShared(
  options: TagsGeneratorOptionsShared | TagsGeneratorOptionsGeneric
): options is TagsGeneratorOptionsShared {
  return (options as TagsGeneratorOptionsShared).domainName === 'shared';
}

// Tag helpers
export interface SourceTagCollectionGeneric {
  superDomain: string;
  superDomainAndDomain: string;
  superDomainDomainAndLib: string;
  superDomainDomainLibAndName?: string;
}

export interface SourceTagCollectionShared {
  superDomain: string;
  superDomainAndDomain: string;
  superDomainDomainAndSubDomain: string;
  superDomainDomainSubDomainAndName: string;
}

// Types for other libs in the same domain (except special-case: shared)
export type LibTypesStr = 'ui' | 'util' | 'state' | 'data_access' | 'models' | 'feature';
export type AllowedLibsInDomainTagCollection = {
  // lib-type: domain-lib-tag-combination
  [lib in LibTypesStr]: string;
};

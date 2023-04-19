export interface DomainCapitalizedOptions {
  domainKebabCase: string;
  domainAllCaps: string;
  domainCamelCase: string;
  domainPascalCase: string;
}

export interface SubStoreCapitalizedOptions {
  subStoreKebabCase: string;
  subStoreAllCaps: string;
  subStoreCamelCase: string;
  subStorePascalCase: string;
}

export const kebabify = (str: string): string =>
  str
    .replace('_', '-')
    .replace(/[A-Z]+(?![a-z])|[A-Z]/g, ($, ofs) => (ofs ? '-' : '') + $.toLowerCase());
export const camelize = (str: string) => str.replace(/-./g, (x) => x[1].toUpperCase());

export function formatCapitalizations(str: string, isDomain: boolean) {
  const dashToUnderScores = str.replace('-', '_');
  const camelizedStr = camelize(str);

  if (!isDomain) {
    return {
      subStoreAllCaps: dashToUnderScores.toUpperCase(),
      subStoreKebabCase: kebabify(str),
      subStorePascalCase: camelizedStr[0].toUpperCase() + camelizedStr.substring(1),
      subStoreCamelCase: camelizedStr[0].toLowerCase() + camelizedStr.substring(1),
    } as SubStoreCapitalizedOptions;
  } else {
    return {
      domainAllCaps: dashToUnderScores.toUpperCase(),
      domainKebabCase: kebabify(str),
      domainPascalCase: camelizedStr[0].toUpperCase() + camelizedStr.substring(1),
      domainCamelCase: camelizedStr[0].toLowerCase() + camelizedStr.substring(1),
    } as DomainCapitalizedOptions;
  }
}

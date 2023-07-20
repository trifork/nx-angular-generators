/* eslint-disable no-console */
import { kebabify } from './naming';

// Tags to be set on the lib itself (package.json)
export function generateTags(args: {  types: string[], scopes: string[] }): string {
  const { types = [], scopes = []} = args;

  const typesMapped = types.map(type => `type:${kebabify(type)}`);
  const scopesMapped = scopes.map(scope => `scope:${kebabify(scope)}`)

  return [...typesMapped, ...scopesMapped].join(", ");
}

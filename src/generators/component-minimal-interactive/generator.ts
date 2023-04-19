import { Tree } from '@nrwl/devkit';
import { ComponentMinimalInteractiveGeneratorSchema } from './schema';
import * as ComponentGenerator from '../component/generator';

export default async function (
  tree: Tree,
  options: ComponentMinimalInteractiveGeneratorSchema
) {
  await ComponentGenerator.default(
    tree,
    {
      ...options,
      domainName: 'willnotbeused',
      subDomainName: 'willnotbeused',
      libName: 'willnotbeused',
      superDomainName: 'willnotbeused',
    },
    true
  );
}

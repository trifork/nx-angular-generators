import { BuildExecutorSchema } from './schema';

export default async function runExecutor(options: BuildExecutorSchema) {
  console.error('Executor ran for Build', options);
  return {
    success: true,
  };
}

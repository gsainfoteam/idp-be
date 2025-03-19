import { TestContainers } from './singleton';

export default async function globalTeardown() {
  const containers = TestContainers.getInstance();
  await containers.cleanup();
}

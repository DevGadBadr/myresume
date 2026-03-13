import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { registerHooks } from 'node:module';

const projectRoot = resolve(import.meta.dirname, '..');
const srcRoot = resolve(projectRoot, 'src');

function resolveAlias(specifier) {
  const basePath = resolve(srcRoot, specifier.slice(2));
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    resolve(basePath, 'index.ts'),
    resolve(basePath, 'index.tsx'),
  ];

  const match = candidates.find((candidate) => existsSync(candidate));
  return match ? pathToFileURL(match).href : null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) {
      const resolved = resolveAlias(specifier);
      if (resolved) {
        return nextResolve(resolved, context);
      }
    }

    return nextResolve(specifier, context);
  },
});

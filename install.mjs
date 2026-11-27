import { homedir } from 'node:os';
import { cp, lstat, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { project: { type: 'boolean' }, help: { type: 'boolean', short: 'h' } },
  });
  if (values.help) {
    console.log('Usage: node install.mjs [codex|claude|both] [--project]');
    return;
  }

  const [target = 'both'] = positionals;
  const folders = { codex: '.agents', claude: '.claude' };
  if (positionals.length > 1 || (target !== 'both' && !Object.hasOwn(folders, target))) {
    throw new Error('Choose codex, claude or both.');
  }
  const source = fileURLToPath(new URL('./skills/chem-slides/', import.meta.url));
  const base = values.project ? process.cwd() : homedir();
  const agents = target === 'both' ? ['codex', 'claude'] : [target];
  const destinations = agents.map(agent => join(base, folders[agent], 'skills', 'chem-slides'));

  for (const destination of destinations) {
    try {
      await lstat(destination);
      throw new Error(`Already installed at ${destination}. Move the existing folder before upgrading.`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }

  for (const destination of destinations) {
    await mkdir(join(destination, '..'), { recursive: true });
    await mkdir(destination);
    await cp(source, destination, { recursive: true });
    console.log(`Installed ${destination}`);
  }
}

try {
  await main();
} catch (error) {
  console.error(`chem-slides: ${error.message}`);
  process.exitCode = 1;
}

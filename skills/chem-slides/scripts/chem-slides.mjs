#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { moleculeSvg } from './render.mjs';
import { figureSvg } from './figure.mjs';

const help = `Usage
  node scripts/chem-slides.mjs render 'SMILES' [options]
  node scripts/chem-slides.mjs figure SPEC.json [--output figure.svg] [--force]

Options
  -o, --output PATH       Write the SVG to PATH instead of stdout
  --force                 Replace an existing output file
  --theme NAME            Render a molecule in paper, slide or dark style
  --label TEXT            Set the accessible label for a molecule
  --id ID                 Assign a unique ID before embedding a molecule
  --highlight MAP         Highlight a SMILES atom-map number, repeatable
  --highlight-color HEX   Set the highlight color
  --bond-thickness N      Set stroke width (0.5–4)
  --font-size N           Set atom label size (7–15 pt)
  --color ELEMENT=#HEX    Override an element color, repeatable
  -h, --help              Show usage

Examples
  node scripts/chem-slides.mjs render 'CC[OH:2]' --highlight 2 -o ethanol.svg
  node scripts/chem-slides.mjs figure examples/slide.json -o slide.svg
`;

const commonOptions = {
  output: { type: 'string', short: 'o' },
  force: { type: 'boolean' },
  help: { type: 'boolean', short: 'h' },
};
const renderOptions = {
  theme: { type: 'string' },
  label: { type: 'string' },
  id: { type: 'string' },
  highlight: { type: 'string', multiple: true },
  'highlight-color': { type: 'string' },
  'bond-thickness': { type: 'string' },
  'font-size': { type: 'string' },
  color: { type: 'string', multiple: true },
};

function numberOption(value) {
  return value === undefined ? undefined : value.trim() ? Number(value) : NaN;
}

async function main(args) {
  const [command, ...tokens] = args;
  if (command === undefined || ['help', '-h', '--help'].includes(command)) {
    process.stdout.write(help);
    return;
  }
  if (!['render', 'figure'].includes(command)) throw new Error(`Unknown command: ${command}.`);

  const options = command === 'render' ? { ...commonOptions, ...renderOptions } : commonOptions;
  const { values, positionals } = parseArgs({ args: tokens, options, allowPositionals: true });
  if (values.help) {
    process.stdout.write(help);
    return;
  }
  if (positionals.length !== 1) throw new Error(`${command} expects exactly one input. See --help.`);
  const [input] = positionals;
  let svg;
  if (command === 'render') {
    const colors = Object.fromEntries((values.color ?? []).map(pair => {
      const match = pair.match(/^([A-Z][a-z]?)=(#[\da-f]{6})$/i);
      if (!match) throw new Error('Use --color ELEMENT=#RRGGBB.');
      return [match[1].toUpperCase(), match[2]];
    }));
    svg = moleculeSvg({
      smiles: input,
      theme: values.theme,
      label: values.label,
      id: values.id,
      highlight: (values.highlight ?? []).map(numberOption),
      structure: {
        colors,
        bondThickness: numberOption(values['bond-thickness']),
        fontSize: numberOption(values['font-size']),
        highlightColor: values['highlight-color'],
      },
    });
  } else {
    const spec = JSON.parse((await readFile(input, 'utf8')).replace(/^\ufeff/u, ''));
    svg = figureSvg(spec);
  }

  if (values.output === undefined) {
    process.stdout.write(svg);
  } else {
    await writeFile(values.output, svg, { flag: values.force ? 'w' : 'wx' });
  }
}

try {
  await main(process.argv.slice(2));
} catch (error) {
  const message = error.code === 'EEXIST' ? 'Output already exists. Use --force to replace it.' : error.message;
  process.stderr.write(`chem-slides: ${message}\n`);
  process.exitCode = 1;
}

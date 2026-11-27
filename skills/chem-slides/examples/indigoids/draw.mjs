import { readFileSync } from 'node:fs';
import { makeSvg, renderMolecule, serializeSvg } from '../../scripts/render.mjs';
import { add, displayFont, placeMolecule, text } from '../svg-composition.mjs';

const { title, pigments } = JSON.parse(readFileSync(new URL('./indigoids.json', import.meta.url), 'utf8'));
const width = 1600;
const height = 900;
const paper = '#F9F6EF';
const ink = '#222130';
const subdued = '#605A64';
const svg = makeSvg(width, height, [0, 0, width, height], title);
add(svg, 'desc', {}, 'Three indigoid dyes at a common scale and orientation. Bromines are highlighted. ' +
  'The woven color swatches illustrate possible hues and are not measurements.');
const defs = add(svg, 'defs');
const threads = add(defs, 'pattern', { id: 'woven', width: 16, height: 16, patternUnits: 'userSpaceOnUse' });
add(threads, 'path', {
  d: 'M 0 2 H 16 M 0 10 H 16 M 2 0 V 8 M 10 8 V 16',
  fill: 'none', stroke: '#fff', 'stroke-opacity': 0.17, 'stroke-width': 2,
});
add(threads, 'path', {
  d: 'M 0 6 H 16 M 0 14 H 16 M 6 8 V 16 M 14 0 V 8',
  fill: 'none', stroke: '#111', 'stroke-opacity': 0.18, 'stroke-width': 2,
});
add(svg, 'rect', { width, height, fill: paper });

text(svg, 72, 144, title, { size: 84, fill: ink, family: displayFont });
text(svg, 76, 197, 'One molecular scaffold with zero, one or two bromine substituents.', { size: 26, fill: subdued });
add(svg, 'path', { d: 'M 74 239 H 1526', stroke: '#C8BFBC', 'stroke-width': 1.5 });

const cell = 448;
const gap = 54;
const left = 74;
const scale = 1.33;
pigments.forEach((pigment, index) => {
  const x = left + (cell + gap) * index;
  const panel = add(svg, 'g', { id: `pigment-${index}` });
  text(panel, x, 304, pigment.name, { size: 39, fill: ink, family: displayFont });
  text(panel, x + cell, 300, `${pigment.highlight.length} Br`, {
    size: 22, fill: pigment.ink, weight: 700, anchor: 'end',
  });
  text(panel, x + 2, 342, pigment.formula, { size: 22, fill: subdued });

  const molecule = renderMolecule({
    id: `structure-${index}`, smiles: pigment.smiles, highlight: pigment.highlight, includeLayout: true,
    structure: {
      bondThickness: 1.9, fontSize: 12, colors: { BR: pigment.ink },
      highlightColor: '#E7CBDB', alignBond: { from: 101, to: 102 },
    },
  });
  const start = molecule.layout.atoms.find(atom => atom.map === 101);
  const end = molecule.layout.atoms.find(atom => atom.map === 102);
  placeMolecule(panel, molecule, {
    x: x + cell / 2, y: 466, scale, origin: { x: (start.x + end.x) / 2, y: start.y },
  });

  const gradientId = `pigment-gradient-${index}`;
  const gradient = add(defs, 'linearGradient', { id: gradientId, x1: '0%', y1: '70%', x2: '100%', y2: '18%' });
  for (const [stop, color] of pigment.swatch.entries()) {
    add(gradient, 'stop', { offset: [0, 0.56, 1][stop], 'stop-color': color });
  }
  const swatch = { x, y: 605, width: cell, height: 138, rx: 5 };
  add(panel, 'rect', { ...swatch, fill: `url(#${gradientId})` });
  add(panel, 'rect', { ...swatch, fill: 'url(#woven)' });

  if (index < pigments.length - 1) {
    const divider = x + cell + gap / 2;
    add(svg, 'path', { d: `M ${divider} 262 V 744`, stroke: '#DDD5CE' });
  }
});

text(svg, 74, 801, 'On wool, 6-bromoindigo can range from blue to purple as dye concentration changes.',
  { size: 23, fill: ink });
text(svg, 74, 846, 'Illustrative swatches  ·  Clark & Cooksey, New J. Chem. (1999), doi:10.1039/A808562E',
  { size: 17, fill: subdued });
process.stdout.write(serializeSvg(svg));

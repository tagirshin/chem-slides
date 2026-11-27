import { readFileSync, writeFileSync } from 'node:fs';
import { fontFamily, makeSvg, renderMolecule, serializeSvg, svgNode } from '../../scripts/render.mjs';

const specPath = process.argv[2] ?? new URL('./panel-d.json', import.meta.url);
const spec = JSON.parse(readFileSync(specPath, 'utf8'));
const ink = '#172536';
const muted = '#556272';
const width = 1320;
const margin = 40;
const rowHeight = 248;
const rowGap = 16;
const top = 124;
const height = top + spec.rows.length * (rowHeight + rowGap) + 40;

const svg = makeSvg(width, height, [0, 0, width, height], spec.title);
const desc = 'Adapted from Armstrong et al., Figure 1d, arXiv:2608.07454v1, CC BY-SA 4.0. ' +
  'The structures were drawn with SmilesDrawer using SMILES from SynthAtlas. Colored traces are figure annotations.';
svg.appendChild(svgNode('desc', {}, desc));
svg.appendChild(svgNode('rect', { width, height, fill: '#f6f8fb' }));

function text(parent, value, x, y, { size = 16, color = ink, weight = 400 } = {}) {
  parent.appendChild(svgNode('text', { x, y, fill: color, 'font-size': size, 'font-weight': weight,
    'font-family': fontFamily }, value));
}

text(svg, spec.title, margin, 51, { size: 34, weight: 700 });
text(svg, 'SynthEx / SynthAtlas  ·  Figure 1d  ·  Retrosynthetic direction (target → precursors)', margin, 84,
  { size: 18, color: muted });

function retroArrow(parent, x1, x2, y) {
  parent.appendChild(svgNode('path', {
    d: `M ${x1} ${y - 3} H ${x2 - 4} M ${x1} ${y + 3} H ${x2 - 4} M ${x2 - 13} ${y - 9} L ${x2} ${y} L ${x2 - 13} ${y + 9}`,
    fill: 'none', stroke: ink, 'stroke-width': 1.9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
  }));
}

function overlayPaths(molecule, layout, color, tag, paths) {
  const layer = svgNode('g', {
    'data-layer': tag, fill: 'none', stroke: color, 'stroke-width': tag === 'accent' ? 9 : 12,
    'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.86,
  });
  const atom = new Map(layout.atoms.map(atom => [atom.index, atom]));
  const key = (a, b) => a < b ? `${a}:${b}` : `${b}:${a}`;
  const bonds = new Set(layout.bonds.map(({ from, to }) => key(from, to)));
  for (const path of paths ?? []) {
    for (const [index, atomIndex] of path.entries()) {
      if (!atom.has(atomIndex)) throw new Error(`Unknown atom ${atomIndex} in ${molecule.smiles}.`);
      if (index && !bonds.has(key(path[index - 1], atomIndex))) {
        throw new Error(`No bond ${path[index - 1]}–${atomIndex} in ${molecule.smiles}.`);
      }
    }
    layer.appendChild(svgNode('polyline', {
      points: path.map(index => `${atom.get(index).x},${atom.get(index).y}`).join(' '),
      'data-atom-path': path.join(' '),
    }));
  }
  return layer;
}

function depiction(molecule, id, highlight) {
  const rendered = renderMolecule({
    smiles: molecule.smiles, id, includeLayout: true,
    structure: { bondThickness: 1.9, fontSize: 10, explicitHydrogens: false },
  });
  const root = svgNode('g', { 'data-layer': 'molecule' });
  root.appendChild(overlayPaths(molecule, rendered.layout, highlight, 'highlight', molecule.highlightPaths));
  if (molecule.accentPaths) {
    root.appendChild(overlayPaths(molecule, rendered.layout, '#ecaa53', 'accent', molecule.accentPaths));
  }
  root.appendChild(rendered.group);
  return { root, viewBox: rendered.viewBox };
}

function place(parent, { root, viewBox }, x, y, scale) {
  const [left, top, width, height] = viewBox;
  const tx = x - (left + width / 2) * scale;
  const ty = y - (top + height / 2) * scale;
  root.setAttribute('transform', `translate(${tx} ${ty}) scale(${scale})`);
  parent.appendChild(root);
}

function drawRow(row, rowIndex) {
  const y = top + rowIndex * (rowHeight + rowGap);
  const section = svgNode('g', { 'data-route': row.route, 'data-source-steps': row.steps.join(' ') });
  svg.appendChild(section);
  section.appendChild(svgNode('rect', { x: margin, y, width: width - 2 * margin, height: rowHeight, rx: 12,
    fill: '#ffffff', stroke: '#d9e1eb' }));
  section.appendChild(svgNode('rect', { x: margin, y: y + 2, width: 5, height: rowHeight - 4, rx: 2.5, fill: row.color }));

  const cellWidth = (width - 2 * margin) / row.cells.length;
  const firstX = margin + cellWidth / 2;
  const entries = row.cells.map((cell, cellIndex) =>
    cell.map((molecule, index) => depiction(molecule, `r${rowIndex}-c${cellIndex}-m${index}`, row.highlight)));
  const innerWidth = cellWidth - 100;
  const moleculeHeight = 170;
  const scale = Math.min(1, ...entries.flatMap(cell =>
    cell.map(({ viewBox }, i) => Math.min(
      (cell.length === 1 ? innerWidth : i === 0 ? innerWidth - 90 : 72) / viewBox[2],
      (i === 0 ? moleculeHeight : moleculeHeight / 2) / viewBox[3],
    ))));

  text(section, row.target, margin + 22, y + 32, { size: 19, weight: 700 });
  text(section, row.title, margin + cellWidth + 5, y + 32, { size: 19, color: row.color, weight: 700 });
  section.appendChild(svgNode('rect', { x: margin + cellWidth + 42, y: y + 43,
    width: width - 2 * margin - cellWidth - 60, height: rowHeight - 82, rx: 8,
    fill: 'none', stroke: row.color, 'stroke-opacity': 0.30, 'stroke-width': 1.4 }));
  const centerY = y + 129;
  for (const [index, cell] of entries.entries()) {
    const x = firstX + index * cellWidth;
    place(section, cell[0], x - (cell.length > 1 ? 36 : 0), centerY, scale);
    cell.slice(1).forEach((item, smallIndex) => {
      place(section, item, x + innerWidth / 2 - 30, centerY + (smallIndex === 0 ? -33 : 33), scale);
    });
    if (index === entries.length - 1) continue;
    const arrowX = x + cellWidth / 2;
    if (row.arrows?.[index] === 'branched') {
      retroArrow(section, arrowX - 34, arrowX + 31, centerY - 11);
      retroArrow(section, arrowX - 34, arrowX + 31, centerY + 11);
    } else {
      retroArrow(section, arrowX - 34, arrowX + 31, centerY);
    }
  }
  text(section, row.notes.join('   ·   '), margin + 22, y + rowHeight - 20, { size: 14, color: muted });
}

spec.rows.forEach(drawRow);
text(svg, 'Adapted from Armstrong et al., arXiv:2608.07454v1  ·  SynthAtlas route data  ·  CC BY-SA 4.0',
  margin, height - 22, { size: 13, color: muted });

const output = serializeSvg(svg);
if (process.argv[3]) writeFileSync(process.argv[3], output, { flag: 'wx' });
else process.stdout.write(output);

import { makeSvg, renderMolecule, serializeSvg } from '../../scripts/render.mjs';
import { add, arrow, placeMolecule, text } from '../svg-composition.mjs';

const width = 1600;
const height = 900;
const ink = '#142942';
const muted = '#4B6179';
const accent = '#2258A5';
const border = '#C9D7E5';
const aubergine = '#833B78';
const elements = { C: ink, N: '#285AA8', O: '#A33864' };
const highlighted = [1, 2, 3];
const title = 'From molecule to prediction';
const svg = makeSvg(width, height, [0, 0, width, height], title);
add(svg, 'desc', {}, 'A molecular property workflow. Draw paracetamol, convert atoms and bonds to a graph, ' +
  'pass messages and pool the resulting atom states, then read out a model estimate of aqueous solubility.');
add(svg, 'rect', { width, height, fill: '#F4F7FB' });
text(svg, 66, 126, title, { size: 74, fill: ink, weight: 700 });
text(svg, 70, 179, 'How a graph neural network uses atoms and bonds to estimate a molecular property.',
  { size: 27, fill: muted });
add(svg, 'path', { d: 'M 68 220 H 1532', stroke: border });

function stage(x, w, label, subtitle, background = '#FFFFFF') {
  const group = add(svg, 'g', { 'data-stage': label });
  add(group, 'rect', { x, y: 261, width: w, height: 459, rx: 14, fill: background, stroke: border });
  text(group, x + 24, 310, label, { size: 29, fill: ink, weight: 700 });
  text(group, x + 24, 347, subtitle, { size: 20, fill: muted });
  return group;
}

const molecule = stage(68, 316, 'Molecule', 'Paracetamol');
const graph = stage(420, 316, 'Molecular graph', 'Atom and bond features');
const encoder = stage(772, 408, 'Graph encoder', 'Message passing and pooling', '#EDF3FB');
const readout = stage(1216, 316, 'Prediction', 'Property readout');

const depiction = renderMolecule({
  smiles: 'C[C:1](=[O:2])[NH:3]C1=CC=C(O)C=C1', id: 'paracetamol',
  theme: 'paper', includeLayout: true, highlight: highlighted,
  structure: {
    alignBond: { from: 1, to: 3 }, colors: { N: elements.N, O: elements.O },
    highlightColor: '#EBD3F1', bondThickness: 1.9, fontSize: 12,
  },
});

const { layout, viewBox } = depiction;
const [left, top, spanX, spanY] = viewBox;
const scale = Math.min(1.44, 290 / spanX, 245 / spanY);
placeMolecule(molecule, depiction, { x: 226, y: 495, scale });
add(molecule, 'rect', { x: 93, y: 647, width: 17, height: 17, rx: 4, fill: '#EBD3F1' });
text(molecule, 123, 661, 'Amide group', { size: 19, fill: aubergine, weight: 700 });

const atoms = new Map(layout.atoms.map(atom => [atom.index, atom]));
const isHighlighted = atom => highlighted.includes(atom.map);
const project = atom => [
  578 + (atom.x - left - spanX / 2) * scale,
  495 + (atom.y - top - spanY / 2) * scale,
];
for (const bond of layout.bonds) {
  const from = atoms.get(bond.from);
  const to = atoms.get(bond.to);
  const [x1, y1] = project(from);
  const [x2, y2] = project(to);
  add(graph, 'line', { x1, y1, x2, y2,
    stroke: isHighlighted(from) && isHighlighted(to) ? '#9C68AF' : '#7F94AC',
    'stroke-width': bond.order === 2 ? 3.5 : 2.1, 'data-bond-order': bond.order,
  });
}
for (const atom of layout.atoms) {
  const [x, y] = project(atom);
  const active = isHighlighted(atom);
  add(graph, 'circle', { cx: x, cy: y, r: atom.element === 'C' && !active ? 6.5 : 12,
    fill: active ? '#EDDDF5' : '#FFFFFF',
    stroke: active ? '#9C68AF' : elements[atom.element], 'stroke-width': 1.6,
  });
  if (atom.element !== 'C' || active) {
    text(graph, x, y + 4.3, atom.element,
      { size: 12.5, fill: elements[atom.element], weight: 700, anchor: 'middle' });
  }
}
text(graph, 444, 652, 'Nodes carry atom features.', { size: 18, fill: muted });
text(graph, 444, 679, 'Edges carry bond features.', { size: 18, fill: muted });

const nitrogen = layout.atoms.find(atom => atom.map === 3);
const neighbours = layout.bonds.flatMap(({ from, to }) => {
  if (from === nitrogen.index) return [atoms.get(to)];
  if (to === nitrogen.index) return [atoms.get(from)];
  return [];
});
add(encoder, 'rect', { x: 798, y: 379, width: 356, height: 134, rx: 10, fill: '#FFFFFF', stroke: border });
text(encoder, 816, 409, 'Update an atom from its neighbors', { size: 18, fill: accent, weight: 700 });
const atomX = 976;
const neighborWidth = 184;
const neighborStart = atomX - neighborWidth / 2;
neighbours.forEach((atom, i) => {
  const x = neighborStart + i * neighborWidth;
  arrow(encoder, x - Math.sign(x - atomX) * 24, 460,
    atomX + Math.sign(x - atomX) * 22, 460, { color: '#798FAE', head: 8 });
  add(encoder, 'circle', { cx: x, cy: 460, r: 15, fill: '#FFFFFF',
    stroke: isHighlighted(atom) ? '#9C68AF' : '#7890AB', 'stroke-width': 1.5 });
  text(encoder, x, 466, atom.element, { size: 15, fill: ink, weight: 700, anchor: 'middle' });
});
add(encoder, 'circle', { cx: atomX, cy: 460, r: 16, fill: '#ECDCF5', stroke: '#9C68AF', 'stroke-width': 1.6 });
text(encoder, atomX, 466, nitrogen.element, { size: 16, fill: elements.N, weight: 700, anchor: 'middle' });
arrow(encoder, atomX, 528, atomX, 566, { color: '#798FAE' });
text(encoder, 816, 606, 'Pool atom states into a vector', { size: 18, fill: accent, weight: 700 });
const swatches = ['#D1DBF1', '#A0B6E3', '#6A89CC', '#B292C8', '#DCC9E8', '#9DB4E1'];
swatches.forEach((color, index) => {
  add(encoder, 'rect', { x: 816 + index * 37, y: 628, width: 32, height: 25, rx: 4, fill: color });
});
text(encoder, 1055, 649, 'z', { size: 26, fill: ink, weight: 700 });

add(readout, 'rect', { x: 1240, y: 395, width: 268, height: 206, rx: 10, fill: '#F0F5FC' });
text(readout, 1374, 474, 'ŷ', { size: 70, fill: accent, weight: 700, anchor: 'middle' });
text(readout, 1374, 528, 'Predicted log S', { size: 28, fill: ink, weight: 700, anchor: 'middle' });
text(readout, 1374, 561, 'Aqueous solubility', { size: 18, fill: muted, anchor: 'middle' });
text(readout, 1240, 663, 'Illustrative model output', { size: 18, fill: muted });

for (const x of [384, 736, 1180]) {
  arrow(svg, x + 7, 491, x + 28, 491, { color: accent, head: 7 });
}
text(svg, 68, 807, 'Message-passing neural network  ·  Gilmer et al., ICML 2017', { size: 19, fill: muted });
process.stdout.write(serializeSvg(svg));

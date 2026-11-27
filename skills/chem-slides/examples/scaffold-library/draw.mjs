import { makeSvg, renderMolecule, serializeSvg } from '../../scripts/render.mjs';
import { add, arrow, placeMolecule, text } from '../svg-composition.mjs';

const width = 1600;
const height = 900;
const ink = '#233144';
const muted = '#4E5C6D';
const teal = '#146A6D';
const berry = '#843B72';
const tealWash = '#CDEDE9';
const berryWash = '#F0D8EA';
const border = '#D8D8DF';
const title = 'One scaffold, four candidates';
const svg = makeSvg(width, height, [0, 0, width, height], title);
add(svg, 'desc', {}, 'Two sites on a pyridine scaffold are marked R1 and R2. ' +
  'Pairing fluorine or chlorine with methoxy or cyclopropyl creates a two-by-two virtual library.');
add(svg, 'rect', { width, height, fill: '#F9F8F5' });
text(svg, 68, 126, title, { size: 72, weight: 700, fill: ink });
text(svg, 71, 179, 'Combine two substituent choices at each site of a shared pyridine scaffold.',
  { size: 27, fill: muted });
add(svg, 'path', { d: 'M 70 220 H 1530', stroke: border });

const scaffold = add(svg, 'g', { 'data-stage': 'scaffold' });
add(scaffold, 'rect', { x: 70, y: 254, width: 418, height: 510, rx: 13, fill: '#FFFFFF', stroke: border });
text(scaffold, 96, 307, 'Shared scaffold', { size: 30, fill: ink, weight: 700 });
text(scaffold, 96, 343, 'Two attachment sites', { size: 21, fill: muted });

const library = add(svg, 'g', { 'data-stage': 'virtual-library' });
add(library, 'rect', { x: 594, y: 254, width: 936, height: 510, rx: 13, fill: '#FFFFFF', stroke: border });
text(library, 620, 307, 'Enumerated library', { size: 30, fill: ink, weight: 700 });
text(library, 1504, 305, '2 × 2 combinations', { size: 21, fill: muted, anchor: 'end' });

const environment = {
  bondThickness: 1.8, fontSize: 12,
  colors: { F: teal, CL: teal, N: '#355A9A', O: berry },
  alignBond: { from: 101, to: 103, angle: 60 },
};
function scaffoldSmiles(first, second) {
  return `n1[c:101](${first})[cH:103]c[c:102](${second})c1`;
}

function depiction(first, second, id) {
  return renderMolecule({
    smiles: scaffoldSmiles(first, second), id, includeLayout: true, structure: environment,
  });
}

function mapAtoms({ layout }) {
  return new Map(layout.atoms.filter(atom => atom.map !== null).map(atom => [atom.map, atom]));
}

function originFor(atoms) {
  const left = atoms.get(101);
  const right = atoms.get(102);
  return { x: (left.x + right.x) / 2, y: (left.y + right.y) / 2 };
}

function markBonds({ group, layout }, atoms, regions) {
  const marks = add(group, 'g', { 'data-layer': 'substituent-highlights', 'stroke-linecap': 'round' });
  const positions = new Map(layout.atoms.map(atom => [atom.index, atom]));
  for (const { maps, color } of regions) {
    const members = new Set(maps.map(map => atoms.get(map).index));
    for (const { from, to } of layout.bonds) {
      if (!members.has(from) || !members.has(to)) continue;
      const start = positions.get(from);
      const end = positions.get(to);
      add(marks, 'line', { x1: start.x, y1: start.y, x2: end.x, y2: end.y,
        stroke: color, 'stroke-width': 10 });
    }
  }
  group.insertBefore(marks, group.firstChild);
}

const parent = depiction('[*:1]', '[*:2]', 'pyridine-scaffold');
const parentAtoms = mapAtoms(parent);
markBonds(parent, parentAtoms, [
  { maps: [101, 1], color: tealWash }, { maps: [102, 2], color: berryWash },
]);
const scaffoldX = 279;
const scaffoldY = 483;
const scaffoldScale = 1.90;
const origin = originFor(parentAtoms);
placeMolecule(scaffold, parent, { x: scaffoldX, y: scaffoldY, scale: scaffoldScale, origin });
for (const [map, label, color] of [[1, 'R¹', teal], [2, 'R²', berry]]) {
  const atom = parentAtoms.get(map);
  text(scaffold, scaffoldX + (atom.x - origin.x) * scaffoldScale, 539, label,
    { size: 26, fill: color, weight: 700, anchor: 'middle' });
}
add(scaffold, 'path', { d: 'M 96 583 H 462', stroke: border });
text(scaffold, 96, 630, 'R¹  Fluorine or chlorine', { size: 22, fill: teal, weight: 700 });
text(scaffold, 96, 673, 'R²  Methoxy or cyclopropyl', { size: 22, fill: berry, weight: 700 });
arrow(svg, 505, 514, 576, 514, { color: muted, width: 2.5, head: 11 });

const columns = [
  { name: 'F', smiles: '[F:11]' },
  { name: 'Cl', smiles: '[Cl:11]' },
];
const rows = [
  { name: 'Methoxy', smiles: '[O:21][CH3:22]', marks: [21, 22] },
  { name: 'Cyclopropyl', smiles: '[CH:21]2[CH2:22][CH2:23]2', marks: [21, 22, 23] },
];
const columnX = [972, 1327];
const rowY = [473, 646];
add(library, 'rect', { x: 619, y: 333, width: 886, height: 52, fill: '#EDF7F6' });
add(library, 'rect', { x: 619, y: 385, width: 175, height: 352, fill: '#FBF2F8' });
for (const x of [794, 1150]) {
  add(library, 'line', { x1: x, y1: 333, x2: x, y2: 737, stroke: border });
}
for (const y of [385, 559]) {
  add(library, 'line', { x1: 619, y1: y, x2: 1505, y2: y, stroke: border });
}

text(library, 635, 367, 'R¹ columns', { size: 19, fill: teal, weight: 700 });
columns.forEach((column, index) => text(library, columnX[index], 367, column.name,
  { size: 22, fill: teal, weight: 700, anchor: 'middle' }));

rows.forEach((row, rowIndex) => {
  const y = rowY[rowIndex];
  text(library, 638, y - 10, 'R²', { size: 19, fill: berry, weight: 700 });
  text(library, 638, y + 24, row.name, { size: 20, fill: ink, weight: 700 });
  columns.forEach((column, columnIndex) => {
    const candidate = depiction(column.smiles, row.smiles, `candidate-${rowIndex}-${columnIndex}`);
    const atoms = mapAtoms(candidate);
    markBonds(candidate, atoms, [
      { maps: [101, 11], color: tealWash }, { maps: [102, ...row.marks], color: berryWash },
    ]);
    placeMolecule(library, candidate, {
      x: columnX[columnIndex] - 8, y, scale: 1.63, origin: originFor(atoms),
    });
  });
});
text(svg, 70, 827, 'Scaffold decoration  ·  Virtual library design', { size: 19, fill: muted });
process.stdout.write(serializeSvg(svg));

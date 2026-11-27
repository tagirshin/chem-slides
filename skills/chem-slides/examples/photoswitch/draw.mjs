import { makeSvg, renderMolecule, serializeSvg } from '../../scripts/render.mjs';
import { add, displayFont, placeMolecule, text } from '../svg-composition.mjs';

const width = 1600;
const height = 900;
const title = 'Azobenzene switches shape under light';
const navy = '#15213A';
const white = '#F7F6FC';
const muted = '#BCC8E1';
const svg = makeSvg(width, height, [0, 0, width, height], title);
add(svg, 'desc', {}, 'Ultraviolet light favors formation of (Z)-azobenzene from the (E) isomer. ' +
  'Thermal relaxation returns the molecule to the (E) isomer.');
add(svg, 'rect', { width, height, fill: navy });

text(svg, 77, 140, title, { size: 69, fill: white, family: displayFont });
text(svg, 80, 199, 'Light changes the relative positions of the phenyl groups around the N=N bond.', { size: 26, fill: muted });
add(svg, 'path', { d: 'M 79 244 H 1521', stroke: '#53627E', 'stroke-width': 1 });

const states = [
  { x: 360, name: '(E)-Azobenzene', label: 'Phenyl groups on opposite sides', accent: '#A9D8FF',
    smiles: 'C1=CC=CC=C1/[N:1]=[N:2]/C1=CC=CC=C1' },
  { x: 1240, name: '(Z)-Azobenzene', label: 'Phenyl groups on the same side', accent: '#D9B8FF',
    smiles: 'C1=CC=CC=C1/[N:1]=[N:2]\\C1=CC=CC=C1' },
];

states.forEach((state, i) => {
  const group = add(svg, 'g', { id: `isomer-${i}` });
  add(group, 'rect', { x: state.x - 281, y: 286, width: 562, height: 458, rx: 14,
    fill: '#1D2C48', stroke: '#415473' });
  const molecule = renderMolecule({
    id: `azobenzene-${i}`, smiles: state.smiles, theme: 'dark',
    structure: { fontSize: 13, bondThickness: 1.9, colors: { N: state.accent },
      alignBond: { from: 1, to: 2, angle: -25 } },
  });
  placeMolecule(group, molecule, { x: state.x, y: 475, scale: 1.60 });
  text(group, state.x, 663, state.name, { size: 38, fill: white, anchor: 'middle', family: displayFont });
  text(group, state.x, 702, state.label, { size: 20, fill: muted, anchor: 'middle' });
});

function arrow(start, end, y, color) {
  const back = end - Math.sign(end - start) * 14;
  add(svg, 'path', {
    d: `M ${start} ${y} H ${end} M ${back} ${y - 10} L ${end} ${y} L ${back} ${y + 10}`,
    fill: 'none', stroke: color, 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
  });
}
text(svg, 800, 435, 'UV light', { size: 24, weight: 700, fill: '#D9B8FF', anchor: 'middle' });
arrow(674, 926, 463, '#D9B8FF');
arrow(926, 674, 516, '#A9D8FF');
text(svg, 800, 555, 'Thermal relaxation', { size: 22, fill: '#A9D8FF', anchor: 'middle' });

text(svg, 80, 822, 'G. S. Hartley, Nature (1937) and J. Chem. Soc. (1938)', { size: 17, fill: muted });
process.stdout.write(serializeSvg(svg));

import { createHash } from 'node:crypto';
import { parseHTML, SmilesDrawer } from './vendor.mjs';

const window = parseHTML('<!doctype html><html></html>');
const { document, SVGElement } = window;
const svgNamespace = 'http://www.w3.org/2000/svg';

export const fontFamily = 'Arial, Helvetica, sans-serif';

export const themes = {
  paper: {
    background: '#ffffff', panel: '#ffffff', ink: '#14181e', muted: '#505b69',
    border: '#d5dbe1', accent: '#265a64', highlight: '#f1bf63',
    elements: { O: '#14181e', N: '#14181e', H: '#14181e' },
  },
  slide: {
    background: '#eef3f4', panel: '#ffffff', ink: '#122631', muted: '#475b65',
    border: '#ccdadd', accent: '#087169', highlight: '#f7c566',
    elements: { O: '#b73335', N: '#2257a4', S: '#846900', H: '#475b65', F: '#167840',
      CL: '#167840', BR: '#a34c24', I: '#713990', P: '#a34c24' },
  },
  dark: {
    background: '#111a25', panel: '#1b2837', ink: '#eff5fa', muted: '#bccbda',
    border: '#3a4c61', accent: '#80d9c9', highlight: '#986d31',
    elements: { O: '#ffaba5', N: '#a9c9ff', S: '#f8d87b', H: '#d2dce7', F: '#a0eab7',
      CL: '#a0eab7', BR: '#ffbe92', I: '#e2baff', P: '#ffbe92' },
  },
};

export function getTheme(name = 'paper') {
  if (!Object.hasOwn(themes, name)) throw new Error('Theme must be paper, slide or dark.');
  return themes[name];
}

export function svgNode(tag, attributes = {}, content) {
  const element = document.createElementNS(svgNamespace, tag);
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, String(value));
  }
  if (content !== undefined) element.textContent = content;
  return element;
}

export function makeSvg(width, height, viewBox, label) {
  const svg = svgNode('svg', {
    xmlns: svgNamespace, width, height, viewBox: viewBox.join(' '),
    role: 'img', 'aria-label': label,
  });
  svg.appendChild(svgNode('title', {}, label));
  return svg;
}

function escapeXml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function serializeNode(node) {
  if (node.nodeType === 3) return escapeXml(node.data);
  const attributes = [...node.attributes].map(({ name, value }) =>
    ` ${name}="${escapeXml(value).replaceAll('"', '&quot;')}"`).join('');
  const tag = node.localName;
  if (!node.firstChild) return `<${tag}${attributes}/>`;
  return `<${tag}${attributes}>${[...node.childNodes].map(serializeNode).join('')}</${tag}>`;
}

export function serializeSvg(svg) {
  return serializeNode(svg) + '\n';
}

export function plainObject(value, allowed, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) throw new Error(`Unknown ${label} field: ${key}.`);
  }
}

export function boundedNumber(value, low, high, label, integer = false) {
  if (!Number.isFinite(value) || value < low || value > high || (integer && !Number.isInteger(value))) {
    throw new Error(`${label} must be ${integer ? 'an integer' : 'a number'} from ${low} to ${high}.`);
  }
  return value;
}

export function textValue(value, limit, label) {
  if (typeof value !== 'string' || value.length > limit || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/u.test(value)) {
    throw new Error(`${label} must be text of up to ${limit} characters.`);
  }
  return value.trim().replace(/\s+/gu, ' ');
}

function hexColor(value, label) {
  if (typeof value !== 'string' || !/^#[0-9a-f]{6}$/i.test(value)) {
    throw new Error(`${label} must be a six-digit hex color.`);
  }
  return value;
}

function paletteFor(theme, colors = {}) {
  if (!colors || typeof colors !== 'object' || Array.isArray(colors)) {
    throw new Error('colors must map element symbols to hex colors.');
  }
  const palette = { C: theme.ink, BACKGROUND: theme.panel, ...theme.elements };
  for (const [key, value] of Object.entries(colors)) {
    if (!/^[A-Z][a-z]?$/i.test(key)) throw new Error(`Invalid element color key: ${key}.`);
    palette[key.toUpperCase()] = hexColor(value, `Color for ${key}`);
  }
  return palette;
}

function parseMolecule(smiles) {
  if (typeof smiles !== 'string' || smiles.length === 0 || smiles.length > 1500 || /[\s<>]/u.test(smiles)) {
    throw new Error('Use one molecule SMILES of 1–1500 characters without whitespace.');
  }

  const tree = SmilesDrawer.Parser.parse(smiles);
  const maps = new Map();
  const openRings = new Set();
  const pending = [tree];
  while (pending.length > 0) {
    const atom = pending.pop();
    for (const { id } of atom.ringbonds) {
      if (!openRings.delete(id)) openRings.add(id);
    }
    const map = atom.atom?.class;
    if (map !== null && map !== undefined) maps.set(map, (maps.get(map) ?? 0) + 1);
    pending.push(...atom.branches);
    if (atom.next) pending.push(atom.next);
  }
  if (openRings.size > 0) {
    throw new Error(`Unclosed ring number(s): ${[...openRings].join(', ')}.`);
  }
  return { tree, maps };
}

function normalizeSvg(svg, id, fontSize) {
  for (const style of svg.querySelectorAll('style')) style.remove();
  for (const label of svg.querySelectorAll('.element, .sub')) {
    const size = label.getAttribute('class') === 'sub' ? fontSize * 0.45 : fontSize;
    label.setAttribute('font-family', fontFamily);
    label.setAttribute('font-size', `${size}pt`);
    label.removeAttribute('class');
  }
  const ids = new Map();
  for (const element of svg.querySelectorAll('[id]')) {
    const previous = element.getAttribute('id');
    const next = `${id}-ref-${ids.size + 1}`;
    ids.set(previous, next);
    element.setAttribute('id', next);
  }
  for (const element of svg.querySelectorAll('*')) {
    for (const attribute of element.attributes) {
      const ref = attribute.value.match(/^url\(#([^\)]+)\)$/);
      if (ref && ids.has(ref[1])) element.setAttribute(attribute.name, `url(#${ids.get(ref[1])})`);
    }
    const style = element.getAttribute('style');
    const translate = style?.match(/^transform:\s*translateX\(([-+\d.e]+)px\) translateY\(([-+\d.e]+)px\);?$/i);
    if (translate) {
      element.setAttribute('transform', `translate(${translate[1]} ${translate[2]})`);
      element.removeAttribute('style');
    }
  }
}

function drawingLayout(graph) {
  const atoms = [];
  const indices = new Map();
  for (const vertex of graph.vertices) {
    const { idx, element, isDrawn, class: map } = vertex.value;
    if (!Number.isInteger(idx) || !vertex.positioned || !isDrawn) continue;
    const { x, y } = vertex.position;
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    atoms.push({ index: idx, element, map: map ?? null, x, y });
    indices.set(vertex.id, idx);
  }
  const bonds = [];
  for (const edge of graph.edges) {
    if (edge.bondType === '.' || !indices.has(edge.sourceId) || !indices.has(edge.targetId)) continue;
    bonds.push({ from: indices.get(edge.sourceId), to: indices.get(edge.targetId), order: edge.weight });
  }
  return { atoms, bonds };
}

export function renderMolecule({ smiles, theme: themeName, structure = {}, highlight = [], id, includeLayout = false }) {
  const theme = getTheme(themeName);
  plainObject(structure, ['bondThickness', 'fontSize', 'colors', 'highlightColor', 'explicitHydrogens'], 'structure');
  const bondThickness = boundedNumber(structure.bondThickness ?? 1.25, 0.5, 4, 'bondThickness');
  const fontSize = boundedNumber(structure.fontSize ?? 10, 7, 15, 'fontSize');
  const explicitHydrogens = structure.explicitHydrogens ?? true;
  if (typeof explicitHydrogens !== 'boolean') throw new Error('explicitHydrogens must be a boolean.');
  const palette = paletteFor(theme, structure.colors);
  const color = hexColor(structure.highlightColor ?? theme.highlight, 'highlightColor');
  const { tree, maps } = parseMolecule(smiles);
  if (!Array.isArray(highlight)) throw new Error('highlight must be an array of SMILES atom-map numbers.');
  const highlights = [...new Set(highlight)].map(map => {
    boundedNumber(map, 0, Number.MAX_SAFE_INTEGER, 'Atom-map number', true);
    if (maps.get(map) !== 1) {
      throw new Error(`Highlight requires exactly one atom with map :${map} in the SMILES.`);
    }
    return [map, color];
  });
  const optionsForId = [smiles, bondThickness, fontSize, palette, highlights];
  if (!explicitHydrogens) optionsForId.push(explicitHydrogens);
  const fingerprint = JSON.stringify(optionsForId);
  const suffix = createHash('sha256').update(fingerprint).digest('hex').slice(0, 12);
  const prefix = id ?? `mol-${suffix}`;
  if (typeof prefix !== 'string' || !/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(prefix)) {
    throw new Error('id must start with a letter and contain up to 64 letters, digits, dashes or underscores.');
  }

  const drawer = new SmilesDrawer.SvgDrawer({
    scale: 1, padding: Math.max(15, fontSize * 1.45),
    bondThickness, bondLength: 30, fontFamily, fontSizeLarge: fontSize,
    fontSizeSmall: fontSize * 0.45, compactDrawing: false, isomeric: true, explicitHydrogens,
    themes: { figure: palette },
  });

  const oldDocument = globalThis.document;
  const oldSvgClass = globalThis.SVGSVGElement;
  let svg;
  try {
    globalThis.document = document;
    globalThis.SVGSVGElement = SVGElement;
    svg = drawer.draw(tree, null, 'figure', null, false, highlights);
  } finally {
    if (oldDocument === undefined) delete globalThis.document;
    else globalThis.document = oldDocument;
    if (oldSvgClass === undefined) delete globalThis.SVGSVGElement;
    else globalThis.SVGSVGElement = oldSvgClass;
  }

  const viewBox = svg.getAttribute('viewBox').split(/\s+/).map(Number);
  if (viewBox.length !== 4 || !viewBox.every(Number.isFinite) || viewBox[2] <= 0 || viewBox[3] <= 0
      || !svg.querySelector('line, path, polygon, text, ellipse, circle:not(mask circle)')) {
    throw new Error('SmilesDrawer did not produce a usable drawing.');
  }
  normalizeSvg(svg, prefix, fontSize);
  const group = svgNode('g', { id: prefix, 'data-smiles': smiles, 'data-renderer': `SmilesDrawer ${SmilesDrawer.Version}` });
  while (svg.firstChild) group.appendChild(svg.firstChild);
  const depiction = { group, viewBox, bondLength: 30 };
  if (includeLayout) depiction.layout = drawingLayout(drawer.preprocessor.graph);
  return depiction;
}

export function moleculeSvg(options) {
  const { group, viewBox, bondLength } = renderMolecule(options);
  const label = textValue(options.label ?? '', 200, 'label') || options.smiles;
  const svg = makeSvg(Math.ceil(viewBox[2]), Math.ceil(viewBox[3]), viewBox, label);
  svg.setAttribute('data-bond-length', bondLength);
  svg.appendChild(group);
  return serializeSvg(svg);
}

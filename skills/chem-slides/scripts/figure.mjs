import {
  boundedNumber, fontFamily, getTheme, makeSvg, plainObject, renderMolecule, serializeSvg, svgNode, textValue,
} from './render.mjs';

function text(svg, value, { x, y, size, fill, weight = 400, align = 'start' }) {
  svg.appendChild(svgNode('text', {
    x, y, fill, 'font-family': fontFamily, 'font-size': size, 'font-weight': weight,
    'text-anchor': align,
  }, value));
}

function estimatedWidth(value, size) {
  let em = 0;
  for (const character of value) {
    if (character === ' ') em += 0.34;
    else if (/[ilI.,:!|]/u.test(character)) em += 0.38;
    else if (/[MW@%&]|[^\x00-\x7f]/u.test(character)) em += 1.1;
    else em += 0.78;
  }
  return em * size;
}

function wrap(value, width, size, field) {
  if (!value) return [];
  const lines = [];
  let line = '';
  for (const word of value.split(' ')) {
    if (estimatedWidth(word, size) > width) {
      throw new Error(`${field} has a word too long for its panel. Increase the width or use fewer columns.`);
    }
    const longer = line ? `${line} ${word}` : word;
    if (estimatedWidth(longer, size) > width) {
      lines.push(line);
      line = word;
    } else {
      line = longer;
    }
  }
  lines.push(line);
  if (lines.length > 3) throw new Error(`${field} needs more than three lines. Shorten it or increase the width.`);
  return lines;
}

function textLines(svg, lines, options) {
  lines.forEach((line, index) => text(svg, line, {
    ...options, y: options.y + index * options.lineHeight,
  }));
}

function layoutSpec(spec) {
  plainObject(spec, ['theme', 'title', 'subtitle', 'note', 'columns', 'width', 'height', 'structure', 'molecules'], 'figure');
  const themeName = spec.theme ?? 'paper';
  const theme = getTheme(themeName);
  const slide = themeName !== 'paper';
  const { molecules } = spec;
  if (!Array.isArray(molecules) || molecules.length < 1 || molecules.length > 12) {
    throw new Error('A figure must contain 1–12 molecules.');
  }
  const columns = boundedNumber(spec.columns ?? Math.min(3, molecules.length), 1, Math.min(4, molecules.length), 'columns', true);
  const rows = Math.ceil(molecules.length / columns);
  const width = boundedNumber(spec.width ?? (slide ? 1600 : 1060), 400, 4096, 'width', true);
  const height = boundedNumber(spec.height ?? (slide ? Math.max(Math.round(width * 9 / 16), rows * 345 + 210) : rows * 300 + 180),
    240, 4096, 'height', true);
  const margin = slide ? 64 : 36;
  const gap = slide ? 24 : 18;
  const panelWidth = (width - 2 * margin - gap * (columns - 1)) / columns;
  if (panelWidth < 125) throw new Error('Panels are too narrow. Increase the width or use fewer columns.');

  const titleSize = slide ? 49 : 32;
  const subtitleSize = slide ? 24 : 18;
  const noteSize = slide ? 20 : 15;
  const labelSize = slide ? 28 : 21;
  const captionSize = slide ? 20 : 15;
  const inner = slide ? 28 : 20;
  const title = textValue(spec.title ?? '', 150, 'title');
  const heading = wrap(title, width - 2 * margin, titleSize, 'title');
  const subtitle = wrap(textValue(spec.subtitle ?? '', 200, 'subtitle'), width - 2 * margin, subtitleSize, 'subtitle');
  const note = wrap(textValue(spec.note ?? '', 240, 'note'), width - 2 * margin, noteSize, 'note');
  const headingHeight = heading.length * (titleSize + 7);
  const subtitleHeight = subtitle.length * (subtitleSize + 6);
  const noteHeight = note.length * (noteSize + 5);
  const panelTop = margin + headingHeight + subtitleHeight + (heading.length || subtitle.length ? gap : 0);
  const panelBottom = height - margin - noteHeight - (note.length ? gap : 0);
  const panelHeight = (panelBottom - panelTop - gap * (rows - 1)) / rows;
  const panels = molecules.map((molecule, index) => {
    const name = `Molecule ${index + 1}`;
    plainObject(molecule, ['smiles', 'label', 'caption', 'highlight'], name);
    const label = textValue(molecule.label ?? '', 80, `${name} label`);
    const caption = textValue(molecule.caption ?? '', 150, `${name} caption`);
    const labelLines = wrap(label, panelWidth - 2 * inner, labelSize, `${name} label`);
    const captionLines = wrap(caption, panelWidth - 2 * inner, captionSize, `${name} caption`);
    return { ...molecule, labelLines, captionLines };
  });
  const labelHeight = Math.max(...panels.map(panel => panel.labelLines.length)) * (labelSize + 5);
  const captionHeight = Math.max(...panels.map(panel => panel.captionLines.length)) * (captionSize + 5);
  const textGap = labelHeight || captionHeight ? (slide ? 14 : 10) : 0;
  const drawingWidth = panelWidth - 2 * inner;
  const drawingHeight = panelHeight - labelHeight - captionHeight - textGap - 2 * inner;
  if (drawingWidth < 70 || drawingHeight < 70) {
    throw new Error('Insufficient drawing space. Increase the canvas size or shorten panel text.');
  }

  return {
    theme, themeName, slide, width, height, margin, gap, columns, inner, panels,
    panelWidth, panelHeight, panelTop, panelBottom, drawingWidth, drawingHeight, textGap,
    title, heading, titleSize, headingHeight, subtitle, subtitleSize, note, noteSize,
    labelSize, labelHeight, captionSize,
  };
}

export function figureSvg(spec) {
  const layout = layoutSpec(spec);
  const {
    theme, themeName, slide, width, height, margin, gap, columns, inner, panels,
    panelWidth, panelHeight, panelTop, panelBottom, drawingWidth, drawingHeight, textGap,
    title, heading, titleSize, headingHeight, subtitle, subtitleSize, note, noteSize,
    labelSize, labelHeight, captionSize,
  } = layout;
  const drawings = panels.map(({ smiles, highlight }, index) => {
    try {
      return renderMolecule({
        smiles, theme: themeName, structure: spec.structure, highlight, id: `figure-mol-${index + 1}`,
      });
    } catch (error) {
      throw new Error(`Molecule ${index + 1}: ${error.message}`);
    }
  });
  const scale = Math.min(
    slide ? 3 : 2.2,
    ...drawings.map(({ viewBox }) => Math.min(drawingWidth / viewBox[2], drawingHeight / viewBox[3])),
  );

  const svg = makeSvg(width, height, [0, 0, width, height], title || 'Molecular structures');
  svg.setAttribute('data-bond-length', (scale * drawings[0].bondLength).toFixed(4));
  svg.appendChild(svgNode('rect', { width, height, fill: theme.background }));
  if (heading.length && slide) {
    svg.appendChild(svgNode('rect', { x: margin, y: margin - 19, width: 52, height: 5, rx: 2.5, fill: theme.accent }));
  }
  textLines(svg, heading, { x: margin, y: margin + titleSize, size: titleSize,
    fill: theme.ink, weight: 700, lineHeight: titleSize + 7 });
  textLines(svg, subtitle, { x: margin, y: margin + headingHeight + subtitleSize, size: subtitleSize,
    fill: theme.muted, lineHeight: subtitleSize + 6 });

  drawings.forEach(({ group, viewBox }, index) => {
    const x = margin + index % columns * (panelWidth + gap);
    const y = panelTop + Math.floor(index / columns) * (panelHeight + gap);
    const centerX = x + panelWidth / 2;
    const centerY = y + inner + drawingHeight / 2;
    svg.appendChild(svgNode('rect', { x, y, width: panelWidth, height: panelHeight, rx: slide ? 16 : 0,
      fill: theme.panel, stroke: theme.border, 'stroke-width': slide ? 1.5 : 1 }));
    if (panels[index].labelLines.length || panels[index].captionLines.length) {
      const divider = y + inner + drawingHeight + textGap / 2;
      svg.appendChild(svgNode('line', { x1: x + inner, x2: x + panelWidth - inner, y1: divider, y2: divider,
        stroke: theme.border, 'stroke-width': 1 }));
    }

    const [vx, vy, vw, vh] = viewBox;
    const tx = centerX - scale * (vx + vw / 2);
    const ty = centerY - scale * (vy + vh / 2);
    group.setAttribute('transform', `translate(${tx} ${ty}) scale(${scale})`);
    svg.appendChild(group);

    const labelsY = y + inner + drawingHeight + textGap;
    textLines(svg, panels[index].labelLines, { x: centerX, y: labelsY + labelSize,
      align: 'middle', size: labelSize, fill: theme.ink, weight: 700, lineHeight: labelSize + 5 });
    textLines(svg, panels[index].captionLines, { x: centerX, y: labelsY + labelHeight + captionSize,
      align: 'middle', size: captionSize, fill: theme.muted, lineHeight: captionSize + 5 });
  });

  textLines(svg, note, { x: margin, y: panelBottom + gap + noteSize, size: noteSize,
    fill: theme.muted, lineHeight: noteSize + 5 });
  return serializeSvg(svg);
}

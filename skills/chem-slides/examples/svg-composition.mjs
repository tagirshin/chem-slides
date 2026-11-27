import { fontFamily, svgNode } from '../scripts/render.mjs';

export const displayFont = 'Georgia, Bitstream Charter, serif';

export function add(parent, tag, attributes, content) {
  const element = svgNode(tag, attributes, content);
  parent.appendChild(element);
  return element;
}

export function text(parent, x, y, value, {
  size = 22, fill = '#192337', anchor = 'start', weight = 400, family = fontFamily, tracking,
} = {}) {
  return add(parent, 'text', {
    x, y, 'font-size': size, 'font-family': family,
    'font-weight': weight, 'text-anchor': anchor, fill,
    ...(tracking ? { 'letter-spacing': tracking } : {}),
  }, value);
}

export function placeMolecule(parent, depiction, { x, y, scale, origin }) {
  const [left, top, width, height] = depiction.viewBox;
  const cx = origin?.x ?? left + width / 2;
  const cy = origin?.y ?? top + height / 2;
  depiction.group.setAttribute('transform', `translate(${x - cx * scale} ${y - cy * scale}) scale(${scale})`);
  parent.appendChild(depiction.group);
}

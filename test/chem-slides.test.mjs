import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { closeSync, mkdtempSync, openSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { figureSvg } from '../skills/chem-slides/scripts/figure.mjs';
import { moleculeSvg, renderMolecule } from '../skills/chem-slides/scripts/render.mjs';
import { parseHTML } from '../skills/chem-slides/scripts/vendor.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const skill = join(root, 'skills', 'chem-slides');
const cli = join(skill, 'scripts', 'chem-slides.mjs');
const slide = JSON.parse(readFileSync(join(skill, 'examples', 'slide.json'), 'utf8'));

function svgRoot(source) {
  return parseHTML(source).document.querySelector('svg');
}

function run(script, args, cwd = root) {
  const directory = mkdtempSync(join(tmpdir(), 'chem-slides-logs-'));
  const files = ['stdout', 'stderr'].map(name => join(directory, name));
  const [stdout, stderr] = files.map(file => openSync(file, 'w'));
  try {
    const result = spawnSync(process.execPath, [script, ...args], { cwd, stdio: ['ignore', stdout, stderr] });
    if (result.error) throw result.error;
    return { ...result, stdout: readFileSync(files[0], 'utf8'), stderr: readFileSync(files[1], 'utf8') };
  } finally {
    closeSync(stdout);
    closeSync(stderr);
    rmSync(directory, { recursive: true, force: true });
  }
}

test('single molecule output is deterministic and has a transparent background', () => {
  const spec = { smiles: 'CC[OH:2]', label: 'Test & review < "sample"', theme: 'dark', highlight: [2] };
  const source = moleculeSvg(spec);
  assert.equal(source, moleculeSvg(spec));
  const svg = svgRoot(source);
  assert.equal(svg.querySelector('title').textContent, spec.label);
  assert.match(source, /aria-label="Test &amp; review &lt; &quot;sample&quot;"/);
  assert.equal(svg.querySelector('[data-smiles]').getAttribute('data-smiles'), spec.smiles);
  assert.ok(svg.querySelector('circle[fill="#986d31"]'));
  assert.equal(svg.querySelector(':scope > rect'), null);
});

test('stereochemical bonds, charges and isotopes reach the artwork', () => {
  const left = svgRoot(moleculeSvg({ smiles: 'N[C@@H](C)C(=O)O', id: 'molecule' }));
  const right = svgRoot(moleculeSvg({ smiles: 'N[C@H](C)C(=O)O', id: 'molecule' }));
  const bondMarkup = root => [...root.querySelectorAll('line, polygon, path')].map(node => node.outerHTML);
  assert.ok(left.querySelector('polygon') || right.querySelector('polygon'));
  assert.notDeepEqual(bondMarkup(left), bondMarkup(right));
  const salt = svgRoot(moleculeSvg({ smiles: '[Na+].[37Cl-]' }));
  assert.deepEqual([...salt.querySelectorAll('text')].map(text => text.textContent), ['Na⁺', '³⁷Cl⁻']);
});

test('layout indices identify input atoms and bonds even when drawing adds stereo hydrogens', () => {
  const smiles = 'N[C@@H:4](C)C(=O)O';
  const { layout } = renderMolecule({ smiles, includeLayout: true });
  assert.equal(layout.atoms.length, 6);
  assert.equal(layout.atoms[1].index, 1);
  assert.equal(layout.atoms[1].map, 4);
  assert.equal(layout.atoms[2].element, 'C');
  assert.ok(layout.atoms.every(({ x, y }) => Number.isFinite(x) && Number.isFinite(y)));
  assert.ok(layout.bonds.some(({ from, to, order }) => from === 3 && to === 4 && order === 2));
  assert.throws(() => renderMolecule({ smiles, structure: { explicitHydrogens: 'no' } }), /boolean/);
});

test('a directed atom-mapped bond aligns the structure before SVG labels are drawn', () => {
  const structure = { alignBond: { from: 1, to: 2, angle: -90 } };
  const { layout } = renderMolecule({ smiles: '[CH3:1][CH2:2]O', structure, includeLayout: true });
  const [start, end] = layout.atoms;
  assert.ok(Math.abs(start.x - end.x) < 1e-6);
  assert.ok(end.y < start.y);
  assert.throws(() => renderMolecule({ smiles: '[CH3:1]C[OH:2]', structure }), /must share a bond/);
  assert.throws(() => renderMolecule({ smiles: '[CH3:1]CO', structure }), /exactly one atom/);
});

test('figure uses distinct, resolvable SVG references and a uniform molecule scale', () => {
  const source = figureSvg(slide);
  assert.equal(source, figureSvg(slide));
  const svg = svgRoot(source);
  assert.equal(svg.getAttribute('viewBox'), '0 0 1600 900');
  const groups = [...svg.querySelectorAll('[data-smiles]')];
  assert.equal(groups.length, 3);
  assert.equal(new Set(groups.map(group => group.getAttribute('transform').match(/scale\(.+\)$/)[0])).size, 1);
  const ids = [...svg.querySelectorAll('[id]')].map(group => group.getAttribute('id'));
  assert.equal(ids.length, new Set(ids).size);
  for (const match of source.matchAll(/url\(#([^\)]+)\)/g)) assert.ok(ids.includes(match[1]));
  assert.ok(svg.querySelector('[fill="#F6C364"]'));
  assert.doesNotMatch(source, /<(?:script|foreignObject|style)\b/);
});

test('invalid structures, unmatched rings, invalid maps and invalid layouts fail', () => {
  assert.throws(() => moleculeSvg({ smiles: 'C%' }), /Expected/);
  assert.throws(() => moleculeSvg({ smiles: 'C1CC' }), /Unclosed ring/);
  assert.throws(() => moleculeSvg({ smiles: 'CCO', highlight: [2] }), /exactly one atom/);
  assert.throws(() => moleculeSvg({ smiles: '[CH3:1][OH:1]', highlight: [1] }), /exactly one atom/);
  assert.throws(() => figureSvg({ ...slide, width: 400 }), /too narrow/);
  assert.throws(() => figureSvg({ ...slide, height: 240 }), /Insufficient drawing space/);
});

test('CLI writes valid output and protects existing files', () => {
  const directory = mkdtempSync(join(tmpdir(), 'chem-slides-cli-'));
  try {
    const file = join(directory, 'figure.svg');
    const args = ['render', 'CCO', '-o', file];
    assert.equal(run(cli, args).status, 0);
    const original = readFileSync(file, 'utf8');
    assert.ok(svgRoot(original).querySelector('line'));
    const existing = run(cli, ['render', 'CCN', '-o', file]);
    assert.equal(existing.status, 1);
    assert.match(existing.stderr, /already exists/);
    assert.equal(readFileSync(file, 'utf8'), original);
    assert.equal(run(cli, ['render', 'CCN', '-o', file, '--force']).status, 0);
    assert.notEqual(readFileSync(file, 'utf8'), original);
    const invalid = run(cli, ['render', 'C1CC']);
    assert.equal(invalid.status, 1);
    assert.equal(invalid.stdout, '');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('installer copies working, standalone skills for both agents', () => {
  const directory = mkdtempSync(join(tmpdir(), 'chem-slides-install-'));
  try {
    const installer = join(root, 'install.mjs');
    const result = run(installer, ['both', '--project'], directory);
    assert.equal(result.status, 0, result.stderr);
    for (const agent of ['.agents', '.claude']) {
      const path = join(directory, agent, 'skills', 'chem-slides');
      assert.match(readFileSync(join(path, 'SKILL.md'), 'utf8'), /name: chem-slides/);
      const output = run(join(path, 'scripts', 'chem-slides.mjs'),
        ['figure', join(path, 'examples', 'slide.json')], directory);
      assert.equal(output.status, 0, output.stderr);
      assert.equal(output.stdout, figureSvg(slide));
    }
    const duplicate = run(installer, ['both', '--project'], directory);
    assert.equal(duplicate.status, 1);
    assert.match(duplicate.stderr, /Already installed/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

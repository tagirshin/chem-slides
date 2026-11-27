---
name: chem-slides
description: Render chemical structures from supplied SMILES with offline SmilesDrawer and make editable SVG figures for papers and slides. Use for molecular drawings, atom-map highlighting, scaffold and fragment comparisons, and chemistry workflows such as graph encoders, property prediction, or virtual library enumeration.
compatibility: Node.js 20 or later. JavaScript dependencies are bundled. Rendering uses local files and runs offline.
---

# Chem Slides

Use the bundled SmilesDrawer CLI for every molecular depiction. Take SMILES from the user or a cited, trusted structure source. When identity, stereochemistry, or protonation is ambiguous, resolve it from the source or ask the user. Preserve the SMILES in the figure specification.

1. Locate this skill directory (the directory containing this file). Use its absolute path for the CLI and examples when working in a different directory.
2. For a single asset, call `render`. For a comparison or multiple panels, write a JSON specification in the working directory and call `figure`. Start from [the example](examples/slide.json) and consult [the format](references/format.md).
3. Choose `paper` for a predominantly monochrome figure, `slide` for color on a light background, or `dark` for a dark presentation. Pass changes to the CLI or edit the JSON and rerun the figure.
4. Inspect the SVG at the intended display size when a viewer is available. Check label legibility, overlapping bonds or labels, isotope and charge labels, and stereo wedges where relevant. SmilesDrawer renders the supplied structure. For publication, cross-check the input and important stereochemical details against the source.
5. Deliver the SVG and, for composed figures, the JSON that generated it. If the user requests a deck, insert each finished SVG as a picture using the slide authoring tool and keep the source SVGs alongside the deck.

```sh
node /path/to/chem-slides/scripts/chem-slides.mjs render 'CC[OH:2]' \
  --theme slide --highlight 2 --label Ethanol -o ethanol.svg

node /path/to/chem-slides/scripts/chem-slides.mjs figure comparison.json -o comparison.svg
```

For atom highlights, select an existing atom map in the SMILES or add one using equivalent bracket syntax. Check its element, hydrogen count, charge and stereo before rendering. For example, the terminal oxygen of ethanol can be written `[OH:2]`. The highlight takes map number `2`.

For custom layouts, render individual SVGs with distinct `--id` values. Place each whole molecule into the target SVG or slide using translation and uniform scaling. Add arrows, labels, callouts and background around the molecule. If embedding into a larger SVG, keep the fragment's masks and other definitions with it. Use the asset's `viewBox` and `data-bond-length` to achieve a common scale. Change the SMILES and rerender when the chemical structure needs an edit.

For a route panel with bond and ring highlights, see the [SynthEx example](examples/synthex/README.md). Its script uses the renderer's projected atom coordinates, validates bond paths against the graph, and places the highlights and molecule in the same SVG transform.

For direct comparisons, orient a shared bond with atom maps as in the [indigoids figure](examples/indigoids/README.md). For a presentation slide that explains a change between two structures, see the [azobenzene example](examples/photoswitch/README.md).

For a workflow, place each rendered molecule in the step where it appears and add arrows and process labels in the parent SVG. The [molecular encoder example](examples/molecular-encoder/README.md) projects the same atom coordinates into a graph beside the structure. The [scaffold library example](examples/scaffold-library/README.md) uses alignment and separate bond overlays to make the changing fragments easy to track. Label illustrative model outputs and virtual candidates as such.

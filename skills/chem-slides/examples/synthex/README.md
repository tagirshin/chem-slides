# SynthEx panel 1d

This rebuilt figure uses structures from three public SynthAtlas records. SmilesDrawer generates the atoms, labels and bonds. The compositor adds editable SVG overlays and retrosynthesis arrows. The molecule artwork uses SmilesDrawer's own orientation and hydrogen display rules.

From the skill directory, run with Node 20 or later:

```sh
node examples/synthex/draw-panel.mjs > rebuilt-panel-d.svg
```

See the [preview](panel-d.png) and [editable SVG](panel-d.svg). The example works offline. Its input is [panel-d.json](panel-d.json). The compound strings come verbatim from the target and selected reaction records. The example shows the portion of each route illustrated in Figure 1d. The Dibohemamine A row condenses the two branches into the common intermediate and precursor set.

Each molecule's `highlightPaths` and `accentPaths` contain sequences of zero-based atom indices in the input SMILES. The script checks that each adjacent pair has a bond and uses the final projected atom positions for each highlighted path. The SVG keeps highlights in groups independent of the molecule artwork.

Public sources:

- [Traversiadiene, route S2](https://synthatlas.epfl.ch/#/route/npa000656_s2), source step indices 0–2.
- [Dibohemamine A, route S3](https://synthatlas.epfl.ch/#/route/npa030041_s3), source step indices 0–5.
- [Cyclopiamine B, route S3](https://synthatlas.epfl.ch/#/route/npa006547_s3), source step indices 0–1.

Adapted from Figure 1d of Daniel Armstrong et al., [Strategy-first synthesis planning for complex natural products](https://arxiv.org/abs/2608.07454v1), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). The rebuilt figure and its figure specification are made available under CC BY-SA 4.0. The adaptation redraws the molecules from SMILES, changes the layout and typography, and recasts the original callouts as shorter captions.

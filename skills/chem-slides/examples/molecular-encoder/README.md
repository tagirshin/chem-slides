# From molecule to prediction

[Slide preview](molecular-encoder.png) · [Editable SVG](molecular-encoder.svg)

This 16:9 slide shows where a chemical structure fits in a graph-based machine-learning workflow. SmilesDrawer renders paracetamol and supplies the positions of its heavy atoms and bonds. The example uses those same coordinates to draw the graph and mark the amide atoms in both views. The message-passing inset shows two heavy-atom neighbors of the amide nitrogen. The vector and the log S readout illustrate the roles of the model stages.

From the skill directory:

```sh
node examples/molecular-encoder/draw.mjs > molecular-encoder.svg
inkscape molecular-encoder.svg --export-width=1200 --export-filename=molecular-encoder.png
```

The SVG builds offline with Node.js. Inkscape is optional for PNG export.

- [Paracetamol structure, PubChem CID 1983](https://pubchem.ncbi.nlm.nih.gov/compound/1983)
- [Gilmer et al., *Neural Message Passing for Quantum Chemistry*, ICML 2017](https://proceedings.mlr.press/v70/gilmer17a.html)

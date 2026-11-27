# Azobenzene photoswitch

[Preview](photoswitch.png) · [Editable SVG](photoswitch.svg)

A 16:9 slide shows the two azobenzene configurations and the directions of ultraviolet photoisomerization and thermal relaxation. The slide aligns the N=N bonds so that the relative position of the phenyl groups is easy to compare. SmilesDrawer generates the structures from stereochemical SMILES.

From the skill directory:

```sh
node examples/photoswitch/draw.mjs > photoswitch.svg
inkscape photoswitch.svg --export-width=1200 --export-filename=photoswitch.png
```

Node.js generates the SVG offline. Inkscape is optional for PNG export.

- Photoswitching: [Hartley, *The Cis-form of Azobenzene*, Nature (1937)](https://doi.org/10.1038/140281a0).
- Thermal relaxation: [Hartley, *J. Chem. Soc.* (1938)](https://doi.org/10.1039/JR9380000633).

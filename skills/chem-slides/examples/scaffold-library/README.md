# One scaffold, four candidates

[Slide preview](scaffold-library.png) · [Editable SVG](scaffold-library.svg)

A pyridine scaffold with two attachment sites defines a four-compound virtual library. Columns choose a halogen at R¹. Rows choose a fragment at R². The script enumerates the pairs, renders every structure with SmilesDrawer, and overlays color on the bonds belonging to each choice. The fixed scaffold is aligned and centered consistently across the grid.

From the skill directory:

```sh
node examples/scaffold-library/draw.mjs > scaffold-library.svg
inkscape scaffold-library.svg --export-width=1200 --export-filename=scaffold-library.png
```

The SVG builds offline with Node.js. Inkscape is optional for PNG export.

For a published example of scaffold decoration in virtual library design, see [LibINVENT](https://doi.org/10.1021/acs.jcim.1c00469).

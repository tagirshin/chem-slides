# From indigo to Tyrian purple

[Preview](indigoids.png) · [Editable SVG](indigoids.svg) · [Molecule and color specification](indigoids.json)

The three structures use the same scale and orientation. Atom maps 101 and 102 identify the central double bond. The script aligns and centers the structures on those atoms. Additional atom maps identify bromines for highlighting.

The 6,6′-dibromoindigo structure represents a principal component of historical Tyrian purple. The swatches illustrate hues. The color of dyed wool varies with the dye loading and the dyeing conditions.

From the skill directory:

```sh
node examples/indigoids/draw.mjs > indigoids.svg
inkscape indigoids.svg --export-width=1200 --export-filename=indigoids.png
```

Node.js generates the SVG offline. Inkscape is optional for PNG export.

- Structures: [Karapanagiotis et al., *Heritage* (2023), Figure 3](https://www.mdpi.com/2571-9408/6/2/116).
- Dye behavior: [Clark and Cooksey, *New Journal of Chemistry* (1999), Figure 3](https://doi.org/10.1039/A808562E).

# SVG figure format

Run `node scripts/chem-slides.mjs --help` for CLI options. The CLI writes SVG to stdout by default, or to a file with `-o`. Use `--force` to replace an existing file after editing the input.

## Figure specification

Save a JSON object with `molecules` and any of the following options.

| Field | Meaning |
| --- | --- |
| `theme` | `paper` (default), `slide`, or `dark`. |
| `title`, `subtitle`, `note` | Optional text at the top and bottom. The layout wraps each field onto up to three lines. |
| `columns` | 1–4, with up to three columns by default. |
| `width`, `height` | Integer SVG dimensions in pixels. Default paper width is 1060 px with height based on row count. A single-row slide defaults to 1600 × 900 px. For a specific size, supply both fields. |
| `structure` | Optional common `bondThickness` (0.5–4), `fontSize` (7–15 pt), `colors` (element symbol to six-digit hex), `highlightColor` (six-digit hex), and `explicitHydrogens` (defaults to `true`). |
| `molecules` | 1–12 objects with a `smiles` string and optional `label`, `caption`, and `highlight` fields. Each `highlight` is an array of atom-map numbers in that molecule's SMILES. |

All structures in a figure use one scale. Bare molecule SVGs have transparent backgrounds. Figure SVGs use the selected theme's background and panels.

Set `structure.alignBond` to `{"from":101,"to":102,"angle":0}` to orient a conserved bond across the figure. Both numbers must be unique atom maps in every molecule and must identify bonded atoms. Angles are clockwise in SVG coordinates and default to 0° (left to right). See the [indigoids example](../examples/indigoids/README.md) for centering each structure on the same mapped bond.

For multilingual labels, ensure the chosen viewer has a font with those glyphs. If long labels fail to fit, use fewer columns, enlarge the figure, or shorten the text.

## Editing and export

- Adjust molecular color, weight, label size and highlighting in the CLI or JSON. Let SmilesDrawer redraw the result.
- In a vector editor, select and move whole molecular groups. Each group carries its source in `data-smiles`. Keep groups and their mask references together if copying SVG markup.
- For slides, place the figure as an SVG picture. Inkscape can export PNG or PDF for destinations that need another format.
- One `render` call depicts one molecular SMILES. Reaction SMILES require a separate layout of the individual structures and arrows. The CLI checks parse errors and unmatched rings, while chemical validation and confidence in the source structure remain separate.

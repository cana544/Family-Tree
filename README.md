# Anand family tree

**[Open the family tree](https://cana544.github.io/Family-Tree/)**

An interactive family archive containing 287 people and 83 families, hosted with GitHub Pages.

Open `index.html` in a browser. The website works directly from the folder without installing anything or starting a server.

Click a person for details. Use “View family branch” or the small branch symbol to change family context. Search reaches all 287 people. The generations menu controls range and cousins. Drag to pan; scroll or use the buttons to zoom. Home returns to Avinesh Anand, and Fit shows the whole included branch.

The website imports 287 people and 83 families from the supplied MyHeritage GEDCOM. Missing facts stay missing. Email, phone, address and account metadata are not part of the generated dataset.

## Files

- `index.html`, `src/`, `data/` are the browser website.
- `scripts/import_gedcom.py` regenerates the minimal dataset from a GEDCOM path.
- `tests/` checks import, visibility and layout geometry.

## Checks

```powershell
node --test --test-isolation=none tests/graph.test.cjs tests/reference.test.cjs tests/geometry.test.cjs
python -m unittest discover -s tests
```

## Hosting

GitHub Pages serves the `main` branch from the repository root. No build command or server is required. The website also works locally by opening `index.html`.

The public website and repository include the recorded names, relationships, dates and places in `data/family.js`. The original GEDCOM, private contact fields, research screenshots and local working files are excluded.

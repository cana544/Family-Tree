# Anand family tree

**[Open the family tree](https://cana544.github.io/Family-Tree/)**

An interactive archive of the Anand family, its history and the connections across generations. Hosted with GitHub Pages.

Open `index.html` in a browser. The website works directly from the folder without installing anything or starting a server.

Click a person for details. Use “View family branch” or the small branch symbol to change family context. Search reaches everyone in the archive. The generations menu controls range and cousins. Drag to pan; scroll or use the buttons to zoom. Home returns to Avinesh Anand, and Fit shows the whole included branch.

Family records are imported from a MyHeritage GEDCOM export. Missing facts stay missing. Email, phone, address and account metadata are not part of the generated dataset.

## Files

- `index.html`, `src/`, `data/` are the browser website.
- `scripts/import_gedcom.py` regenerates the minimal dataset from a GEDCOM path.
- `tests/` checks import, visibility and layout geometry.

## Checks

```powershell
node --test --test-isolation=none tests/graph.test.cjs tests/reference.test.cjs tests/geometry.test.cjs
python -m unittest discover -s tests
```

## Updating the live website

This local project is connected to `https://github.com/cana544/Family-Tree.git`. In VS Code, save your changes, commit them, and **Push** or **Sync Changes** to `main`. GitHub Pages automatically deploys the pushed version. Saving or committing locally alone does not update the public website.

Deployment can take a few minutes. Check the repository's Actions tab for the Pages build and deployment status.

## Hosting

GitHub Pages serves the `main` branch from the repository root. No build command or server is required. The website also works locally by opening `index.html`.

The public website and repository include the recorded names, relationships, dates and places in `data/family.js`. The original GEDCOM, private contact fields, research screenshots and local working files are excluded.

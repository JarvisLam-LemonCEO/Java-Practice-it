# Private source material

This directory contains the supplied textbook exercise PDF and instructor solution HTML used to generate `data/exercises.js`.

The solution material is intended for private study use. Do not commit this directory, the generated exercise dataset, or a built copy of the site to a public repository.

To rebuild the paired exercise dataset, install Python packages `pypdf` and `lxml`, then run:

```bash
python3 scripts/import-exercises.py
```

The importer validates that all 390 PDF exercises have exactly one matched HTML solution entry. Online-only solutions without a corresponding prompt in the supplied PDF are excluded.

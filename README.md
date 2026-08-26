
# Java Practice Library
A private, searchable study website for Java questions, textbook exercises, and matched solutions.

## Live Website
[Open Java Practice Library](https://java-practice-it.vercel.app/)

> [!WARNING]
> **Private study edition.** The Exercises and Solutions sections contain supplied instructor material. Keep the repository and any deployment private, and do not publish or redistribute the included source material.

## Features

- Home page with expandable chapters and searchable question lists
- Questions directory with topic and chapter filters
- Exercises directory with prompts extracted from the supplied textbook PDF
- Solutions directory with HTML solutions matched to their corresponding exercises
- Question and exercise detail pages using the same card-based interface
- Previous and next navigation on detail pages
- Syntax-highlighted Java code and one-click solution copying
- Persistent light and dark modes with device-preference detection
- Individual PDF export for every question and exercise with its solution
- Complete Questions PDF containing all questions and solutions
- Complete Exercises PDF containing all exercises and matched solutions
- Light, print-friendly PDF output even when the website is in dark mode
- Responsive Tailwind CSS interface
- Static hash-based routing suitable for Vercel or another static host
- No database, backend, framework, or runtime npm dependencies

## Technology

| Component | Purpose |
| --- | --- |
| HTML | Application shell and metadata |
| Tailwind CSS | Responsive interface styling through the browser CDN |
| Vanilla JavaScript | Rendering, routing, search, filters, dark mode, and PDF controls |
| Node.js | Java source parsing and production build generation |
| Python | Textbook PDF extraction and HTML solution matching |

## Run locally

### Requirements

- [Node.js](https://nodejs.org/) 18 or newer
- Python 3
- An internet connection while viewing the site, because Tailwind CSS and the web fonts load from CDNs

Download or clone the project, open a terminal in its directory, and run:

```bash
cd java-practice-private-site
npm run dev
```

Open [http://localhost:4173](http://localhost:4173) in a browser. Stop the server with `Ctrl+C`.

No `npm install` step is required. The development command starts Python's built-in static file server.

### Do not open `index.html` directly

Opening the file with a `file://` address can prevent scripts and source files from loading correctly. Use `npm run dev` and visit the local HTTP address instead.

## Production build

Generate the Java question dataset and create the deployable website:

```bash
npm run build
```

The completed static site is written to `dist/`.

## Deploy to Vercel

This project includes `vercel.json`, so Vercel can use the correct build command and output directory automatically:

| Setting | Value |
| --- | --- |
| Framework preset | Other |
| Build command | `node scripts/build.mjs` |
| Output directory | `dist` |

To deploy from Git:

1. Create a **private** Git repository and push the project to it.
2. Import that repository into Vercel.
3. Confirm the build command and output directory shown above.
4. Configure access protection before sharing or opening the deployment.
5. Deploy and verify that the resulting URL is not publicly accessible.

> [!IMPORTANT]
> A private Git repository does not automatically guarantee a private website. Verify the deployment's access controls because this project contains instructor solutions and supplied textbook material.

## Project structure

```text
java-practice-private-site/
â”œâ”€â”€ app.js                    # Rendering, routing, search, and interactions
â”œâ”€â”€ data/
â”‚   â”œâ”€â”€ exercises.js          # Generated exercise and matched-solution data
â”‚   â””â”€â”€ questions.js          # Generated Java question and solution data
â”œâ”€â”€ dist/                     # Generated Vercel-ready static website
â”œâ”€â”€ favicon.svg               # Site icon
â”œâ”€â”€ index.html                # Application shell and Tailwind configuration
â”œâ”€â”€ private-source/
â”‚   â”œâ”€â”€ exercises.pdf         # Supplied textbook exercise pages
â”‚   â””â”€â”€ exercise-solutions-4ed.html
â”œâ”€â”€ scripts/
â”‚   â”œâ”€â”€ build.mjs             # Creates the production build
â”‚   â”œâ”€â”€ generate-data.mjs     # Parses Java files into website data
â”‚   â””â”€â”€ import-exercises.py   # Matches PDF prompts to HTML solutions
â”œâ”€â”€ source-java/              # Original Java solutions grouped by chapter
â”œâ”€â”€ styles.css                # Theme, code, accessibility, and print styles
â”œâ”€â”€ package.json              # Local development and build commands
â””â”€â”€ vercel.json               # Vercel static-build configuration
```

## Adding or editing Java questions

Place each `.java` file inside the appropriate chapter folder under `source-java/`. Put the question in a leading block comment and the solution below it:

```java
/*
 * Write a method named square that accepts an integer
 * and returns the square of that value.
 */
public static int square(int value) {
    return value * value;
}
```

Leading consecutive `//` comments are also supported.

After changing the Java files, regenerate the question data:

```bash
npm run generate
```

To regenerate the data and rebuild `dist/` together:

```bash
npm run build
```

When a source file has no leading question comment, its solution is preserved and the website displays a notice that the original prompt was unavailable. The current collection contains 13 such files.

## Re-importing exercises and solutions

The generated dataset already contains all 390 exercises and 464 matched solution variants. Re-import only after replacing the supplied PDF or HTML solution file.

Install the importer dependencies:

```bash
python3 -m pip install pypdf lxml
```

Then import and rebuild:

```bash
npm run import-exercises
npm run build
```

The importer checks exercise numbering, matches the PDF prompts to their HTML solutions, excludes online-only solutions without a corresponding PDF prompt, and stops if a chapter cannot be paired correctly.

## Search and filters

- **Home:** search practice questions and filter them by topic, then expand a chapter to view its matches.
- **Questions:** search filenames, prompts, solutions, topics, or chapter titles; filter by topic and chapter.
- **Exercises and Solutions:** search exercise numbers, names, prompts, solutions, topics, or chapter titles; filter by topic and chapter.

## PDF export

The website uses the browser's native print system instead of a PDF library.

### Export one question or exercise

1. Open a question or exercise.
2. Select **Export PDF**.
3. Choose **Save as PDF** in the browser's print dialog.

Each exercise export includes both its prompt and matched solution.

### Export a complete collection

- Select **Questions PDF** on the Home page to export all 328 questions and solutions.
- Select **Exercises PDF** on the Home page to export all 390 exercises and 464 matched solution variants.

The print stylesheet hides navigation and controls, adds page breaks between entries, formats code for paper, and always uses a light backgroundâ€”even if dark mode is active on the website.

## Application routes

The application uses URL hashes, allowing every route to work on a static host without server-side rewrites:

| Route | Page |
| --- | --- |
| `#/` | Home and expandable chapter browser |
| `#/questions` | Searchable questions directory |
| `#/question/{question-id}` | Question and solution detail |
| `#/exercises` | Searchable exercises directory |
| `#/exercise/{exercise-id}` | Exercise prompt and matched solution |
| `#/solutions` | Searchable solutions directory |
| `#/solution/{exercise-id}` | Solution and corresponding exercise prompt |
| `#/print/all` | Complete printable questions collection |
| `#/print/exercises` | Complete printable exercises collection |

Always keep the `#` portion of a copied route. For example:

```text
https://your-site.example/#/exercise/exercise-chapter-1-1
```

If a chapter or detail link displays a 404 page, return Home and confirm that the URL still contains `#/` before the route name.

## Dark mode

Use the theme button in the navigation bar to switch themes. The selected theme is saved in the browser. If no theme has been selected, the site follows the device preference.

Dark mode affects only the website interface. PDF exports always use the light print theme for readability and lower ink usage.

## Customization

- Edit the Tailwind configuration in `index.html` to change colors, fonts, or shadows.
- Edit `styles.css` to adjust dark mode, code highlighting, accessibility, animations, or print layout.
- Edit chapter titles and topics in `scripts/generate-data.mjs`.
- Edit the importer topic rules in `scripts/import-exercises.py`.
- Run `npm run build` after production changes so `dist/` stays current.

## Troubleshooting

### Changes do not appear

Run `npm run build`, redeploy the contents of `dist/`, and perform a hard refresh in the browser.

### A route displays 404

Use hash routes such as `#/questions` or `#/exercise/{exercise-id}`. Do not convert them to paths such as `/questions` or `/exercise/{exercise-id}`.

### The page has no styling

Confirm that the device is online and can load Tailwind CSS and the fonts from their CDN addresses.

### The PDF print preview is dark

Deploy the latest build, hard-refresh the page, and open the export again. The current print stylesheet forces a light color scheme for both question and exercise exports.

## Privacy and content rights

This repository has no open-source license. The supplied textbook exercises and instructor solutions are included only for private study. Do not publish, redistribute, sublicense, or make the project publicly accessible without permission from the rights holder.

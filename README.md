
  # Java Practice Library

  A searchable, chapter-based collection of Java programming questions and solutions.

## Live Link: 

## About

Java Practice Library turns a directory of `.java` exercise files into a focused study website. The leading comment in each Java file becomes the question prompt, while the remaining source code becomes the solution.

Students can browse exercises by chapter, search the complete collection, filter by topic, move between questions, copy solutions, and export study material to PDF.

## Features

- Expandable chapter browser on the home page
- Complete questions directory grouped by chapter
- Full-text search across filenames, prompts, solutions, topics, and chapters
- Topic and chapter filters
- Individual question pages with syntax-highlighted Java solutions
- Previous and next question navigation using source filenames
- One-click solution copying
- Print-friendly export for individual questions
- Complete question-and-solution collection export
- Responsive Tailwind interface
- Accessible navigation, labels, focus behavior, and reduced-motion support
- Static Vercel deployment with no server or database

## Technology

| Component | Purpose |
| --- | --- |
| HTML | Application shell and metadata |
| Tailwind CSS | Responsive interface styling through the browser CDN |
| Vanilla JavaScript | Search, filtering, routing, chapter expansion, and PDF controls |
| Node.js | Java source parsing and static build generation |
| Vercel | Static hosting and deployment |

The application has no runtime npm dependencies. Tailwind is loaded from its official browser CDN.

## Getting started

### Requirements

- [Node.js](https://nodejs.org/) 18 or newer
- Python 3 for the included local development command

### Run locally

Clone or download the repository, then open a terminal in the project directory:

```bash
cd java-practice-site
npm run dev
```

Open [http://localhost:4173](http://localhost:4173) in your browser.

Stop the local server with `Ctrl+C`.

You can also start the server directly:

```bash
python3 -m http.server 4173
```

No `npm install` step is required.

## Production build

Generate the question data and build the deployable site:

```bash
npm run build
```

The finished static website is written to `dist/`.

## Deploy to Vercel

1. Push the project to a GitHub repository.
2. In Vercel, select **Add New â†’ Project**.
3. Import the GitHub repository.
4. Deploy the project.

The included [`vercel.json`](./vercel.json) supplies the required configuration:

| Setting | Value |
| --- | --- |
| Framework preset | Other |
| Build command | `node scripts/build.mjs` |
| Output directory | `dist` |

Vercel will regenerate the question data and publish only the static build output.

## Project structure

```text
java-practice-site/
â”œâ”€â”€ app.js                    # Application rendering, routing, and interactions
â”œâ”€â”€ data/
â”‚   â””â”€â”€ questions.js          # Generated question-and-solution dataset
â”œâ”€â”€ dist/                     # Generated Vercel deployment output
â”œâ”€â”€ favicon.svg               # Site icon
â”œâ”€â”€ index.html                # Application shell and Tailwind configuration
â”œâ”€â”€ scripts/
â”‚   â”œâ”€â”€ build.mjs             # Creates the production build
â”‚   â””â”€â”€ generate-data.mjs     # Parses Java files into website data
â”œâ”€â”€ source-java/              # Original Java exercises grouped by chapter
â”œâ”€â”€ styles.css                # Custom, animation, code, and print styles
â”œâ”€â”€ package.json              # Development and build commands
â””â”€â”€ vercel.json               # Vercel configuration
```

## Adding or editing questions

Place each Java file inside the appropriate folder under `source-java/`. The generator recognizes folders such as `chapter-1`, `chapter-2`, and `graphics`.

Use a leading block comment for the question, followed by the solution:

```java
/*
 * Write a method named square that accepts an integer
 * and returns the square of that value.
 */
public static int square(int value) {
    return value * value;
}
```

Consecutive `//` comments at the beginning of a file are also supported.

After changing the Java sources, regenerate the dataset:

```bash
npm run generate
```

To regenerate the data and create a new production build together:

```bash
npm run build
```

### Files without question comments

When a Java file does not contain a leading comment, the website preserves its solution and displays a notice explaining that the original question prompt was unavailable. This project currently contains 13 such files.

## PDF export

The project uses the browser's native print system instead of a PDF library.

- On a question page, select **Export PDF**.
- On the home page, select **Download all as PDF** for the complete collection.
- In the browser dialog, choose **Save as PDF** as the destination.

Print-specific styles remove navigation and controls, adjust code formatting, and place complete-collection questions on separate pages.

## Application routes

The site uses client-side hash routing so it works on any static host:

| Route | Page |
| --- | --- |
| `#/` | Home and chapter browser |
| `#/questions` | Searchable questions directory |
| `#/question/{question-id}` | Question and solution detail |
| `#/print/all` | Printable complete collection |

## Customization

- Edit the Tailwind configuration in `index.html` to change colors, fonts, or shadows.
- Edit `styles.css` for code highlighting, animations, and print layout.
- Update `chapterTitles` and `chapterTopics` in `scripts/generate-data.mjs` to change chapter metadata.
- Update the topic rules in the same generator to adjust automatic classification.

Run `npm run build` after making production changes.

## Contributing

Contributions can include corrected solutions, improved prompts, accessibility enhancements, or interface refinements. Keep each question in its matching chapter folder and regenerate the dataset before opening a pull request.

## Content and licensing

The repository does not currently include an open-source license. Add an appropriate license before allowing reuse or redistribution, and confirm that you have permission to publish the included exercise text and solutions.

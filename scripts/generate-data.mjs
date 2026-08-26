import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.cwd());
const sourceRoot = path.join(root, 'source-java');
const outputFile = path.join(root, 'data', 'questions.js');

const chapterTitles = {
  'chapter-1': 'Introduction to Java Programming',
  'chapter-2': 'Primitive Data and Definite Loops',
  'chapter-3': 'Parameters and Objects',
  'chapter-4': 'Conditional Execution',
  'chapter-5': 'Program Logic and Indefinite Loops',
  'chapter-6': 'File Processing',
  'chapter-7': 'Arrays',
  'chapter-8': 'Classes',
  'chapter-9': 'Inheritance and Interfaces',
  'chapter-10': 'ArrayLists',
  'chapter-11': 'The Java Collections Framework',
  'chapter-12': 'Recursion',
  'chapter-13': 'Searching and Sorting',
  'chapter-14': 'Stacks and Queues',
  'chapter-15': 'Linked Lists',
  'chapter-16': 'Binary Trees',
  'chapter-17': 'Binary Search Trees',
  'chapter-18': 'Hashing',
  graphics: 'Graphics'
};

const chapterTopics = {
  'chapter-1': 'Fundamentals',
  'chapter-2': 'Loops',
  'chapter-3': 'Methods & Strings',
  'chapter-4': 'Conditionals',
  'chapter-5': 'While Loops',
  'chapter-6': 'File I/O',
  'chapter-7': 'Arrays',
  'chapter-8': 'Classes & Objects',
  'chapter-9': 'Inheritance',
  'chapter-10': 'ArrayLists',
  'chapter-11': 'Collections',
  'chapter-12': 'Recursion',
  'chapter-13': 'Searching & Sorting',
  'chapter-14': 'Stacks & Queues',
  'chapter-15': 'Linked Lists',
  'chapter-16': 'Binary Trees',
  'chapter-17': 'Search Trees',
  'chapter-18': 'Hashing',
  graphics: 'Graphics'
};

const topicRules = [
  [/graphic|drawingpanel|draw(line|rect|oval)|color\b/i, 'Graphics'],
  [/hash|hashset|hashmap/i, 'Hashing'],
  [/binary.?search|search.?tree|bst/i, 'Search Trees'],
  [/tree|leaf|treenode/i, 'Binary Trees'],
  [/linked|listnode/i, 'Linked Lists'],
  [/\b(stack|queue)\b/i, 'Stacks & Queues'],
  [/\b(sort|search|selection|merge)\w*\b/i, 'Searching & Sorting'],
  [/recurs|writebinary|writechars/i, 'Recursion'],
  [/\b(map|set|iterator|collection)\b/i, 'Collections'],
  [/arraylist/i, 'ArrayLists']
];

function naturalChapterOrder(folder) {
  if (folder === 'graphics') return 999;
  const match = folder.match(/\d+/);
  return match ? Number(match[0]) : 998;
}

function cleanComment(comment) {
  return comment
    .replace(/^\/\*+/, '')
    .replace(/\*+\/$/, '')
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, '').trimEnd())
    .join('\n')
    .trim();
}

function splitQuestionAndSolution(raw, filename) {
  const normalized = raw.replace(/^\uFEFF/, '').replace(/\u00A0/g, ' ').replace(/\r\n?/g, '\n').trim();
  const block = normalized.match(/^\s*(\/\*[\s\S]*?\*\/)/);
  if (block) {
    return {
      question: cleanComment(block[1]),
      solution: normalized.slice(block[0].length).trim(),
      hasSourceQuestion: true
    };
  }

  const lines = normalized.split('\n');
  const commentLines = [];
  let index = 0;
  while (index < lines.length && /^\s*\/\//.test(lines[index])) {
    commentLines.push(lines[index].replace(/^\s*\/\/\s?/, ''));
    index += 1;
  }
  if (commentLines.length) {
    return {
      question: commentLines.join('\n').trim(),
      solution: lines.slice(index).join('\n').trim(),
      hasSourceQuestion: true
    };
  }

  return {
    question: `The source file ${filename} does not include a question comment. Review the provided implementation as the solution for this exercise.`,
    solution: normalized,
    hasSourceQuestion: false
  };
}

function inferTopic(folder, filename, question, solution) {
  const searchable = `${filename} ${question} ${solution}`;
  for (const [pattern, topic] of topicRules) {
    if (pattern.test(searchable)) return topic;
  }
  return chapterTopics[folder] || 'Java';
}

function slugify(folder, filename) {
  return `${folder}-${filename.replace(/\.java$/i, '')}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.java')) files.push(fullPath);
  }
  return files;
}

const files = await walk(sourceRoot);
const questions = [];

for (const filePath of files) {
  const raw = await readFile(filePath, 'utf8');
  const filename = path.basename(filePath);
  const folder = path.basename(path.dirname(filePath));
  const { question, solution, hasSourceQuestion } = splitQuestionAndSolution(raw, filename);
  questions.push({
    id: slugify(folder, filename),
    filename,
    title: filename.replace(/\.java$/i, ''),
    chapterId: folder,
    chapterNumber: naturalChapterOrder(folder),
    chapter: folder === 'graphics' ? 'Graphics' : `Chapter ${naturalChapterOrder(folder)}`,
    chapterTitle: chapterTitles[folder] || folder,
    topic: inferTopic(folder, filename, question, solution),
    question,
    solution,
    hasSourceQuestion
  });
}

questions.sort((a, b) => a.chapterNumber - b.chapterNumber || a.filename.localeCompare(b.filename, undefined, { numeric: true }));

await mkdir(path.dirname(outputFile), { recursive: true });
await writeFile(outputFile, `window.JAVA_QUESTIONS = ${JSON.stringify(questions, null, 2)};\n`, 'utf8');

const missing = questions.filter((question) => !question.hasSourceQuestion).length;
console.log(`Generated ${questions.length} questions (${missing} without source comments).`);

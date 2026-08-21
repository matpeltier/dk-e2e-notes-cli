#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const DEFAULT_FILE = 'notes.json';

export function loadNotes(file = DEFAULT_FILE) {
  if (!existsSync(file)) {
    return [];
  }
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addNote(text, file = DEFAULT_FILE) {
  const trimmed = typeof text === 'string' ? text.trim() : '';
  if (!trimmed) {
    throw new Error('note text must not be empty');
  }

  const notes = loadNotes(file);
  const nextId = notes.reduce((max, note) => Math.max(max, Number(note.id) || 0), 0) + 1;
  const note = { id: nextId, text: trimmed };

  notes.push(note);
  writeFileSync(file, `${JSON.stringify(notes, null, 2)}\n`);

  return note;
}

function printUsage() {
  console.error('Usage: node src/notes.js add <text>');
}

export function main(argv = process.argv.slice(2)) {
  const [command, ...args] = argv;

  if (command === 'add') {
    try {
      const note = addNote(args.join(' '));
      console.log(note.id);
      return 0;
    } catch (error) {
      console.error(`Error: ${error.message}`);
      return 1;
    }
  }

  printUsage();
  return 1;
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  process.exitCode = main();
}

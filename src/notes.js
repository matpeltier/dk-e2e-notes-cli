#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const NOTES_FILE = join(process.cwd(), 'notes.json');

export function loadNotes(file = NOTES_FILE) {
  if (!existsSync(file)) {
    return [];
  }
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

function saveNotes(notes, file = NOTES_FILE) {
  writeFileSync(file, `${JSON.stringify(notes, null, 2)}\n`);
}

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

export function addNote(text, file = NOTES_FILE) {
  const trimmed = typeof text === 'string' ? text.trim() : '';
  if (!trimmed) {
    throw new Error('note text must not be empty');
  }

  const notes = loadNotes(file);
  const nextId = notes.reduce((max, note) => Math.max(max, Number(note.id) || 0), 0) + 1;
  const note = { id: nextId, text: trimmed };

  notes.push(note);
  saveNotes(notes, file);

  return note;
}

function listNotes() {
  for (const note of loadNotes()) {
    console.log(`${note.id}: ${note.text}`);
  }
}

function removeNote(idArg) {
  if (idArg === undefined) {
    fail('usage: node src/notes.js remove <id> (id required)');
  }
  const id = Number(idArg);
  if (!Number.isInteger(id)) {
    fail(`invalid note id: ${idArg}`);
  }
  const notes = loadNotes();
  if (!notes.some((n) => n.id === id)) {
    fail(`note with id ${id} not found`);
  }
  saveNotes(notes.filter((n) => n.id !== id));
  console.log(`Removed note ${id}`);
}

function printUsage() {
  console.error('Usage: node src/notes.js <add|list|remove> [args]');
}

export function main(argv = process.argv.slice(2)) {
  const [command, ...args] = argv;

  switch (command) {
    case 'add': {
      try {
        const note = addNote(args.join(' '));
        console.log(note.id);
        return 0;
      } catch (error) {
        console.error(`Error: ${error.message}`);
        return 1;
      }
    }
    case 'list':
      listNotes();
      return 0;
    case 'remove':
      removeNote(args[0]);
      return 0;
    default:
      printUsage();
      return 1;
  }
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  process.exit(main());
}

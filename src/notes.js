#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const NOTES_FILE = join(process.cwd(), 'notes.json');

function loadNotes() {
  try {
    return JSON.parse(readFileSync(NOTES_FILE, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

function saveNotes(notes) {
  writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2) + '\n');
}

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
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

const [command, ...args] = process.argv.slice(2);

switch (command) {
  case 'list':
    listNotes();
    break;
  case 'remove':
    removeNote(args[0]);
    break;
  default:
    fail(`Unknown command: ${command ?? '(none)'}`);
}

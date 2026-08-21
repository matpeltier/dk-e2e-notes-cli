#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const NOTES_FILE = join(process.cwd(), 'notes.json');

function readNotes() {
  try {
    return JSON.parse(readFileSync(NOTES_FILE, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

function writeNotes(notes) {
  writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2) + '\n');
}

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function removeNote(idArg) {
  if (idArg === undefined) {
    fail('usage: node src/notes.js remove <id> (id required)');
  }
  const id = Number(idArg);
  const notes = readNotes();
  const note = notes.find((n) => n.id === id);
  if (!note) {
    fail(`note with id ${idArg} not found`);
  }
  writeNotes(notes.filter((n) => n.id !== id));
  console.log(`Removed note ${id}`);
}

const [command, ...args] = process.argv.slice(2);

switch (command) {
  case 'remove':
    removeNote(args[0]);
    break;
  default:
    fail('usage: node src/notes.js <add|list|remove> [args]');
}

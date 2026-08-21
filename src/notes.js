#!/usr/bin/env node

import { readFileSync } from 'node:fs';
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

function listNotes() {
  for (const note of loadNotes()) {
    console.log(`${note.id}: ${note.text}`);
  }
}

const command = process.argv[2];

if (command === 'list') {
  listNotes();
} else {
  console.error(`Unknown command: ${command ?? '(none)'}`);
  process.exit(1);
}

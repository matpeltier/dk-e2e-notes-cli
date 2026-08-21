import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { loadNotes, addNote } from '../src/notes.js';

const CLI_PATH = fileURLToPath(new URL('../src/notes.js', import.meta.url));

describe('addNote', () => {
  let dir;
  let file;

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'notes-add-'));
    file = path.join(dir, 'notes.json');
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  test('persists a note with id 1 to a fresh store and returns it', () => {
    const note = addNote('buy milk', file);

    assert.deepEqual(note, { id: 1, text: 'buy milk' });
    const stored = JSON.parse(readFileSync(file, 'utf8'));
    assert.deepEqual(stored, [{ id: 1, text: 'buy milk' }]);
  });

  test('auto-increments ids based on the highest existing id', () => {
    writeFileSync(file, JSON.stringify([{ id: 7, text: 'existing' }]));

    const note = addNote('second note', file);

    assert.equal(note.id, 8);
    const stored = JSON.parse(readFileSync(file, 'utf8'));
    assert.deepEqual(stored, [
      { id: 7, text: 'existing' },
      { id: 8, text: 'second note' },
    ]);
  });

  test('appends to notes loaded from disk without clobbering them', () => {
    addNote('first', file);
    addNote('second', file);

    const stored = loadNotes(file);
    assert.deepEqual(stored, [
      { id: 1, text: 'first' },
      { id: 2, text: 'second' },
    ]);
  });

  test('rejects empty text with a clear error', () => {
    assert.throws(() => addNote('', file), /empty/i);
    assert.equal(existsSync(file), false);
  });

  test('rejects whitespace-only text', () => {
    assert.throws(() => addNote('   \n\t ', file), /empty/i);
    assert.equal(existsSync(file), false);
  });

  test('rejects a missing argument', () => {
    assert.throws(() => addNote(undefined, file), /empty/i);
  });
});

describe('notes CLI (add)', () => {
  let dir;

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'notes-cli-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  function runCli(args) {
    return spawnSync(process.execPath, [CLI_PATH, ...args], { cwd: dir, encoding: 'utf8' });
  }

  test('adds a note to notes.json and prints the id', () => {
    const result = runCli(['add', 'buy milk']);

    assert.equal(result.status, 0, `stderr: ${result.stderr}`);
    assert.match(result.stdout.trim(), /^1$/);

    const stored = JSON.parse(readFileSync(path.join(dir, 'notes.json'), 'utf8'));
    assert.deepEqual(stored, [{ id: 1, text: 'buy milk' }]);
  });

  test('prints incrementing ids across runs', () => {
    runCli(['add', 'first']);
    const result = runCli(['add', 'second']);

    assert.equal(result.status, 0, `stderr: ${result.stderr}`);
    assert.match(result.stdout.trim(), /^2$/);

    const stored = JSON.parse(readFileSync(path.join(dir, 'notes.json'), 'utf8'));
    assert.deepEqual(
      stored.map((n) => n.id),
      [1, 2],
    );
  });

  test('rejects empty text with a clear error and non-zero exit code', () => {
    const result = runCli(['add', '']);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /error/i);
    assert.equal(existsSync(path.join(dir, 'notes.json')), false);
  });

  test('rejects a missing text argument', () => {
    const result = runCli(['add']);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /error/i);
  });
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const cliPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'notes.js');

function setupNotesDir(notes) {
  const dir = mkdtempSync(join(tmpdir(), 'notes-cli-test-'));
  writeFileSync(join(dir, 'notes.json'), JSON.stringify(notes, null, 2) + '\n');
  return dir;
}

function runRemove(dir, id) {
  return spawnSync(process.execPath, [cliPath, 'remove', String(id)], {
    cwd: dir,
    encoding: 'utf8',
  });
}

test('remove deletes the note and rewrites the file without it', () => {
  const dir = setupNotesDir([
    { id: 1, text: 'buy milk' },
    { id: 2, text: 'walk dog' },
  ]);

  const result = runRemove(dir, 1);

  assert.equal(result.status, 0);
  const remaining = JSON.parse(readFileSync(join(dir, 'notes.json'), 'utf8'));
  assert.deepEqual(remaining, [{ id: 2, text: 'walk dog' }]);
});

test('remove keeps other notes intact', () => {
  const dir = setupNotesDir([
    { id: 1, text: 'buy milk' },
    { id: 2, text: 'walk dog' },
    { id: 3, text: 'write report' },
  ]);

  const result = runRemove(dir, 2);

  assert.equal(result.status, 0);
  const remaining = JSON.parse(readFileSync(join(dir, 'notes.json'), 'utf8'));
  assert.deepEqual(remaining, [
    { id: 1, text: 'buy milk' },
    { id: 3, text: 'write report' },
  ]);
});

test('remove with unknown id exits non-zero with a clear error', () => {
  const dir = setupNotesDir([{ id: 1, text: 'buy milk' }]);
  const before = readFileSync(join(dir, 'notes.json'), 'utf8');

  const result = runRemove(dir, 99);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /not found/i);
  assert.equal(readFileSync(join(dir, 'notes.json'), 'utf8'), before);
});

test('remove with a non-numeric id exits non-zero with a clear error', () => {
  const dir = setupNotesDir([{ id: 1, text: 'buy milk' }]);
  const before = readFileSync(join(dir, 'notes.json'), 'utf8');

  const result = runRemove(dir, 'abc');

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /invalid/i);
  assert.equal(readFileSync(join(dir, 'notes.json'), 'utf8'), before);
});

test('remove with missing id argument exits non-zero with a clear error', () => {
  const dir = setupNotesDir([{ id: 1, text: 'buy milk' }]);

  const result = spawnSync(process.execPath, [cliPath, 'remove'], {
    cwd: dir,
    encoding: 'utf8',
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /usage|id required/i);
});

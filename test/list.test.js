import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const cliPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'notes.js',
);

function makeTempDir() {
  return mkdtempSync(join(tmpdir(), 'notes-cli-list-'));
}

function runCli(args, cwd) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd,
    encoding: 'utf8',
  });
}

test('list prints nothing and exits 0 when no notes exist', () => {
  const cwd = makeTempDir();
  try {
    const result = runCli(['list'], cwd);
    assert.equal(result.status, 0);
    assert.equal(result.stdout, '');
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('list prints nothing and exits 0 when notes.json is empty', () => {
  const cwd = makeTempDir();
  try {
    writeFileSync(join(cwd, 'notes.json'), '[]\n');
    const result = runCli(['list'], cwd);
    assert.equal(result.status, 0);
    assert.equal(result.stdout, '');
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('list prints notes as "id: text" lines, newest last', () => {
  const cwd = makeTempDir();
  try {
    writeFileSync(
      join(cwd, 'notes.json'),
      JSON.stringify([
        { id: 1, text: 'buy milk' },
        { id: 2, text: 'walk the dog' },
      ]),
    );
    const result = runCli(['list'], cwd);
    assert.equal(result.status, 0);
    assert.equal(result.stdout, '1: buy milk\n2: walk the dog\n');
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

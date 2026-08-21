import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { main } from '../src/notes.js';

const cliPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'notes.js',
);

describe('main dispatch', () => {
  function outputOf(mockFn) {
    return mockFn.mock.calls.map((c) => c.arguments.join(' ')).join('\n');
  }

  test('unknown command returns 1 and prints usage to stderr', (t) => {
    const log = t.mock.method(console, 'log', () => {});
    const error = t.mock.method(console, 'error', () => {});

    const code = main(['frobnicate']);

    assert.equal(code, 1);
    assert.match(outputOf(error), /usage/i);
    assert.equal(log.mock.callCount(), 0);
  });

  test('missing command returns 1 and prints usage to stderr', (t) => {
    const log = t.mock.method(console, 'log', () => {});
    const error = t.mock.method(console, 'error', () => {});

    const code = main([]);

    assert.equal(code, 1);
    assert.match(outputOf(error), /usage/i);
    assert.equal(log.mock.callCount(), 0);
  });

  test('add with empty text returns 1 and prints an error without stdout', (t) => {
    const log = t.mock.method(console, 'log', () => {});
    const error = t.mock.method(console, 'error', () => {});

    const code = main(['add', '   \n\t ']);

    assert.equal(code, 1);
    assert.match(outputOf(error), /error/i);
    assert.equal(log.mock.callCount(), 0);
  });
});

describe('notes CLI (cross-command flow)', () => {
  let dir;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'notes-cli-flow-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  function runCli(args) {
    return spawnSync(process.execPath, [cliPath, ...args], {
      cwd: dir,
      encoding: 'utf8',
    });
  }

  test('added notes appear in list output, newest last', () => {
    const first = runCli(['add', 'buy milk']);
    assert.equal(first.status, 0, `stderr: ${first.stderr}`);
    assert.match(first.stdout.trim(), /^1$/);

    const second = runCli(['add', 'walk the dog']);
    assert.equal(second.status, 0, `stderr: ${second.stderr}`);
    assert.match(second.stdout.trim(), /^2$/);

    const list = runCli(['list']);
    assert.equal(list.status, 0);
    assert.equal(list.stdout, '1: buy milk\n2: walk the dog\n');
  });

  test('a removed note disappears from list output and the store', () => {
    runCli(['add', 'buy milk']);
    runCli(['add', 'walk the dog']);

    const remove = runCli(['remove', '1']);
    assert.equal(remove.status, 0, `stderr: ${remove.stderr}`);
    assert.match(remove.stdout, /removed note 1/i);

    const list = runCli(['list']);
    assert.equal(list.status, 0);
    assert.equal(list.stdout, '2: walk the dog\n');

    const stored = JSON.parse(readFileSync(join(dir, 'notes.json'), 'utf8'));
    assert.deepEqual(stored, [{ id: 2, text: 'walk the dog' }]);
  });
});

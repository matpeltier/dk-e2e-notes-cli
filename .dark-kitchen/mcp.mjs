#!/usr/bin/env node
// Minimal MCP client for the Dark Kitchen HTTP endpoint.
// Usage: node mcp.mjs <toolName> [jsonArgs]
const [tool, argsRaw] = process.argv.slice(2);
const args = argsRaw ? JSON.parse(argsRaw) : {};
const res = await fetch('http://127.0.0.1:18801/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: { name: tool, arguments: args },
  }),
});
const text = await res.text();
let payload = text.trim();
if (payload.startsWith('event:') || payload.includes('\ndata:')) {
  payload = payload
    .split('\n')
    .filter((l) => l.startsWith('data:'))
    .map((l) => l.slice(5).trim())
    .join('');
}
const json = JSON.parse(payload);
if (json.error) {
  console.error('RPC error:', JSON.stringify(json.error));
  process.exit(1);
}
for (const item of json.result.content ?? []) {
  if (item.type === 'text') console.log(item.text);
  else console.log(JSON.stringify(item));
}

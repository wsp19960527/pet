/**
 * Wait for Docker MySQL to accept connections (port 13306).
 */
import net from 'node:net';

const host = '127.0.0.1';
const port = 13306;
const maxAttempts = 60;
const delayMs = 1000;

function tryConnect(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port }, () => {
      socket.end();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
    socket.setTimeout(2000, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

process.stdout.write(`Waiting for MySQL at ${host}:${port}`);

for (let i = 0; i < maxAttempts; i++) {
  if (await tryConnect()) {
    console.log(' — ready');
    process.exit(0);
  }
  process.stdout.write('.');
  await new Promise((r) => setTimeout(r, delayMs));
}

console.error('\nTimeout: MySQL not ready. Is Docker running? Run: pnpm db:up');
process.exit(1);

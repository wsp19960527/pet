/**
 * Wait for local MySQL (port 3306).
 */
import net from 'node:net';

const host = '127.0.0.1';
const port = Number(process.env.MYSQL_PORT ?? 3306);
const maxAttempts = 30;
const delayMs = 500;

function tryConnect() {
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

console.error('\nTimeout: local MySQL not reachable. Is brew services start mysql running?');
process.exit(1);

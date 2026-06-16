/**
 * Create pet database + user on local MySQL (port 3306).
 * Requires admin credentials via MYSQL_ROOT_PASSWORD or MYSQL_ADMIN_URL.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, 'apps/api/.env');

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(envPath);

const adminUrl = process.env.MYSQL_ADMIN_URL;
const rootPassword = process.env.MYSQL_ROOT_PASSWORD;
const rootUser = process.env.MYSQL_ROOT_USER ?? 'root';
const host = process.env.MYSQL_HOST ?? '127.0.0.1';
const port = process.env.MYSQL_PORT ?? '3306';

const sqlPath = join(root, 'scripts/setup-local-mysql.sql');

function runMysql(user, password) {
  const args = ['-h', host, '-P', port, '-u', user];
  if (password) {
    args.push(`-p${password}`);
  }
  return spawnSync('mysql', args, {
    input: readFileSync(sqlPath),
    encoding: 'utf8',
  });
}

let result;

if (adminUrl) {
  const parsed = new URL(adminUrl);
  result = runMysql(
    decodeURIComponent(parsed.username || 'root'),
    decodeURIComponent(parsed.password || ''),
  );
} else if (rootPassword !== undefined) {
  result = runMysql(rootUser, rootPassword);
} else {
  console.error(`
无法连接本机 MySQL：需要管理员账号。

在 apps/api/.env 里添加一行（仅本机开发，勿提交真实密码到 Git）：

  MYSQL_ROOT_PASSWORD=你的root密码

然后重新执行：

  pnpm db:setup:local

或一次性指定：

  MYSQL_ROOT_PASSWORD=xxx pnpm db:setup:local
`);
  process.exit(1);
}

if (result.status !== 0) {
  process.stderr.write(result.stderr || '');
  process.stdout.write(result.stdout || '');
  console.error('\n本机 MySQL 初始化失败，请检查 root 密码与 MySQL 服务是否已启动。');
  process.exit(result.status ?? 1);
}

console.log('Local MySQL ready: pet@127.0.0.1:3306/pet');

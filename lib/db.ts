import { Pool, type QueryResultRow } from 'pg';
let pool: Pool | undefined;
export function db() {
  if (pool) return pool;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is missing');
  const ca = process.env.PG_CA_CERT_BASE64 ? Buffer.from(process.env.PG_CA_CERT_BASE64, 'base64').toString('utf8') : undefined;
  // Do not add sslmode to the pg connection string: pg's parser can override tls config.
  const u = new URL(url);
  u.searchParams.delete('sslmode');
  pool = new Pool({
    connectionString: u.toString(),
    ssl: { rejectUnauthorized: true, ...(ca ? { ca } : {}) },
    max: 3,
    connectionTimeoutMillis: 8000,
    idleTimeoutMillis: 10000
  });
  return pool;
}
export async function query<T extends QueryResultRow = QueryResultRow>(sql: string, params: unknown[] = []) {
  return db().query<T>(sql, params);
}


import { Pool, QueryResult, QueryResultRow } from "pg";

let pool: Pool | undefined;

function getPool(): Pool {
  if (pool) return pool;

  const databaseUrl = process.env.DATABASE_URL;
  const encodedCA = process.env.PG_CA_CERT_BASE64;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing");
  }

  if (!encodedCA || encodedCA === "[SENSITIVE]") {
    throw new Error("PG_CA_CERT_BASE64 is missing");
  }

  const url = new URL(databaseUrl);

  // Prevent URL parameters from overriding SSL settings.
  url.searchParams.delete("sslmode");
  url.searchParams.delete("sslcert");
  url.searchParams.delete("sslkey");
  url.searchParams.delete("sslrootcert");

  const ca = Buffer.from(
    encodedCA,
    "base64"
  ).toString("utf8");

  pool = new Pool({
    connectionString: url.toString(),
    ssl: {
      ca,
      rejectUnauthorized: true,
    },
    connectionTimeoutMillis: 10000,
    max: 5,
  });

  return pool;
}

export async function query<
  T extends QueryResultRow = QueryResultRow
>(
  sql: string,
  params: unknown[] = []
): Promise<QueryResult<T>> {
  return getPool().query<T>(sql, params);
}

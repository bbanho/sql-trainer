import * as duckdb from '@duckdb/duckdb-wasm';
import { QueryResult } from '../types';

let db: duckdb.AsyncDuckDB | null = null;
let conn: duckdb.AsyncDuckDBConnection | null = null;

export const initDb = async (seedSql: string): Promise<void> => {
  // If db exists, just reconnect or ensure state
  if (!db) {
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
    const workerBlob = new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' });
    const workerUrl = URL.createObjectURL(workerBlob);
    const worker = new Worker(workerUrl);
    const logger = new duckdb.ConsoleLogger();
    db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  }
  
  if (conn) {
    await conn.close();
  }
  conn = await db.connect();
  
  // Re-seed on init
  await conn.query(seedSql);
};

export const resetDb = async (seedSql: string): Promise<void> => {
  if (!db || !conn) {
    await initDb(seedSql);
    return;
  }
  // Ideally we drop all tables, but easiest way to "Switch scenarios" in WASM 
  // without persistence is just to re-run init logic or drop known tables.
  // For this app, simply creating tables that don't exist or re-init is fine.
  // Since we use the same connection, we should probably close and reopen to be clean
  // or Drop the tables we know about. 
  // A clean approach for this simple app:
  try {
    // Attempt to drop tables if they exist to prevent conflicts if switching back and forth
    await conn.query(`DROP TABLE IF EXISTS Alunos; DROP TABLE IF EXISTS Disciplinas; DROP TABLE IF EXISTS Aproveitamentos; DROP TABLE IF EXISTS Cursos; DROP TABLE IF EXISTS Professores;`);
  } catch (e) {
    console.log("Cleanup warning", e);
  }
  await conn.query(seedSql);
}

export const runQuery = async (sql: string): Promise<QueryResult | { error: string }> => {
  if (!conn) {
    return { error: "Banco de dados não inicializado." };
  }

  try {
    const result = await conn.query(sql);
    const rows = result.toArray().map((row) => {
      const cleanRow: Record<string, unknown> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rowData = row.toJSON() as any; 
      for (const key in rowData) {
        cleanRow[key] = rowData[key];
      }
      return cleanRow;
    });

    return rows;
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
};

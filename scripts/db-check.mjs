import postgres from 'postgres';
import process from 'node:process';

process.loadEnvFile('.env.local');

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function run() {
  const tables = await sql`SELECT table_schema, table_name FROM information_schema.tables WHERE table_name LIKE '%usuario%'`;
  console.log('Tables:', tables);
  
  const constraints = await sql`
    SELECT conname, pg_get_constraintdef(c.oid)
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE conname LIKE '%usuario%'
  `;
  console.log('Constraints:', constraints);

  process.exit(0);
}
run();

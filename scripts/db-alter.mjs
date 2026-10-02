import postgres from 'postgres';
import process from 'node:process';

process.loadEnvFile('.env.local');

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function run() {
  try {
    await sql`ALTER TABLE public.usuario_rol DROP CONSTRAINT usuario_rol_rol_check;`;
    console.log("Constraint eliminada con éxito.");
    
    await sql`
      ALTER TABLE public.usuario_rol 
      ADD CONSTRAINT usuario_rol_rol_check 
      CHECK (rol IN ('admin', 'escaner', 'vendedor'));
    `;
    console.log("Constraint agregada con éxito.");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}
run();

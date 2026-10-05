import pg from "pg";

// Schema is managed by Sequelize migrations (see migrations/),
// run with `npm run db:setup` before starting the app.
export const pool = new pg.Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "todos",
  // AWS RDS requires SSL; set DB_SSL=true there
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

// Fails if the DB is unreachable or migrations haven't been run
export async function checkDb() {
  await pool.query("SELECT 1 FROM todos LIMIT 1");
}

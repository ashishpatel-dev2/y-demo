import express from "express";
import cors from "cors";
import { pool, checkDb } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

// Health check (used by Docker / AWS load balancer)
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.get("/api/todos", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM todos ORDER BY id DESC");
  res.json(rows);
});

app.post("/api/todos", async (req, res) => {
  const title = (req.body.title || "").trim();
  if (!title) return res.status(400).json({ error: "title is required" });
  const { rows } = await pool.query(
    "INSERT INTO todos (title) VALUES ($1) RETURNING *",
    [title]
  );
  res.status(201).json(rows[0]);
});

app.put("/api/todos/:id", async (req, res) => {
  const { title, completed } = req.body;
  const { rows } = await pool.query(
    `UPDATE todos
       SET title = COALESCE($1, title),
           completed = COALESCE($2, completed)
     WHERE id = $3 RETURNING *`,
    [title ?? null, completed ?? null, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: "not found" });
  res.json(rows[0]);
});

app.delete("/api/todos/:id", async (req, res) => {
  const { rowCount } = await pool.query("DELETE FROM todos WHERE id = $1", [
    req.params.id,
  ]);
  if (!rowCount) return res.status(404).json({ error: "not found" });
  res.status(204).end();
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "internal server error" });
});

const PORT = process.env.PORT || 5000;

// Retry DB connection so the app survives the DB starting slowly
async function start(retries = 10) {
  try {
    await checkDb();
    app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
  } catch (err) {
    if (retries === 0) throw err;
    console.log(`DB not ready (${err.message}), retrying in 3s...`);
    setTimeout(() => start(retries - 1), 3000);
  }
}
start();

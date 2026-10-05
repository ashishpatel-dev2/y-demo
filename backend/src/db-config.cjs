// Database settings for sequelize-cli (db:create, db:migrate).
// Same env vars as src/db.js, so local, docker-compose and ECS all work.
const config = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "todos",
  dialect: "postgres",
  // AWS RDS requires SSL; set DB_SSL=true there
  dialectOptions:
    process.env.DB_SSL === "true"
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {},
};

// sequelize-cli picks the block matching NODE_ENV; use one config for all
module.exports = { development: config, test: config, production: config };

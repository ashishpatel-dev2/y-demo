// Creates DB_NAME if it doesn't exist. Unlike `sequelize-cli db:create`,
// it's safe to run on every deploy. Uses the same config as migrations.
const { Sequelize } = require("sequelize");
const { production: config } = require("../src/db-config.cjs");

async function main() {
  // Connect to the built-in "postgres" database, which always exists
  const sequelize = new Sequelize({ ...config, database: "postgres", logging: false });
  try {
    const [rows] = await sequelize.query(
      "SELECT 1 FROM pg_database WHERE datname = :name",
      { replacements: { name: config.database } }
    );
    if (rows.length) {
      console.log(`Database "${config.database}" already exists`);
      return;
    }
    const name = sequelize.getQueryInterface().quoteIdentifier(config.database);
    await sequelize.query(`CREATE DATABASE ${name}`);
    console.log(`Database "${config.database}" created`);
  } finally {
    await sequelize.close();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

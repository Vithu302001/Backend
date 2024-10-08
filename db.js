const Pool = require("pg").Pool;
require("dotenv").config({ path: "../.env" });

const pool = new Pool({
  user: "postgres",
  password: process.env.DB_PASSWORD,
  host: "localhost",
  port: 5432,
  database: "AgroSL",
});

module.exports = pool;

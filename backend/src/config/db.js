const mysql = require("mysql2/promise");
require("dotenv").config();

const connectionConfig = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 5,
  idleTimeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 10000,
};

if (process.env.DB_SSL === "true") {
  connectionConfig.ssl = { rejectUnauthorized: false };
}

const pool = mysql.createPool(connectionConfig);

module.exports = pool;

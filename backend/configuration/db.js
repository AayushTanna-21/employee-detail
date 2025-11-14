const sql = require("mssql");

const serverConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || "localhost",
  database: process.env.DB_NAME || "EmployeeDB",
  options: {
    port: 1433,
    trustServerCertificate: true,
  },
};

async function getConnection() {
  const pool = await sql.connect(serverConfig);
  return pool;
}

module.exports = { sql, getConnection };

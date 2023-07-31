const Pool = require("pg").Pool;
const dotenv = require('dotenv').config()

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    host: "localhost",
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
})

module.exports = pool;
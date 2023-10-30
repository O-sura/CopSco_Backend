const Pool = require("pg").Pool;
const dotenv = require('dotenv').config()

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    host: "localhost",
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
})

// Database configuration for RMV
const rmvPool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    host: "localhost",
    port: process.env.DB_PORT,
    database: process.env.RMV_NAME
});

module.exports = {
    rmvPool: rmvPool,
    pool: pool
};
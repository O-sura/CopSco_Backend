const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session); 
const { pool } = require('../db.config');

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, httpOnly: true },
  // store: new pgSession({
  //   pool: pool, // Your PostgreSQL pool instance
  //   tableName: 'sessions', // The name of the table you created for session storage
  // }),
});

module.exports = sessionMiddleware;

const session = require('express-session');
const dotenv = require('dotenv').config()

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, httpOnly: true },
});

module.exports = sessionMiddleware;

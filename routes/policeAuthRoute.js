const express = require('express');
const router  = express.Router()
const bcrypt = require('bcrypt');
const {pool} = require('../db.config')
const axios = require('axios');
const jwt = require('jsonwebtoken')


router.post('/register', async (req,res) => {
    const {username, pass, userrole} = req.body;
    let officer =  await pool.query('SELECT * FROM police_officer WHERE officerid = $1', [username]);
    
    if (officer.rows.length == 0) {
        return res.status(400).json({ error: 'No such officer record exists' });
    }

    if (officer.rows.length > 0) {
        return res.status(400).json({ error: 'User already exists' });
    }

    // Encrypt the password using bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(pass, saltRounds);

    // Insert user data into the database
    const newUser = await pool.query(
      'INSERT INTO police_user (username, password, userrole) VALUES ($1, $2, $3) RETURNING *',
      [username, hashedPassword, userrole]
    );

    // Return the newly created user
    res.status(200).json("User successfilly created");
})

router.post('/login', async (req,res) => {
    const { username, pass } = req.body;
  
    try {
      // Retrieve the user from the database based on the provided username
      const user = await pool.query('SELECT pu.*, po.* FROM police_user pu INNER JOIN police_officer po ON pu.username = po.officerid WHERE pu.username = $1', [username]);
  
      if (user.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Compare the provided password with the hashed password from the database
      const isPasswordValid = await bcrypt.compare(pass, user.rows[0].password);
  
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const userrole = user.rows[0].userrole;
      const fname = user.rows[0].fname;

      const payload = {
        username: user.rows[0].username,
        userrole: userrole
      };
  
      const secretKey = process.env.JWT_TOKEN_SECRET; // Replace with a strong secret key for signing the token
      const accessToken = jwt.sign(payload, secretKey, { expiresIn: '15m' }); // Access token expires in 1 hour
      const refreshToken = jwt.sign(payload, secretKey, { expiresIn: '7d' }); // Refresh token expires in 1 day
  
      
      await pool.query('DELETE FROM police_user_tokens WHERE username = $1', [user.rows[0].username]);
      await pool.query('INSERT INTO police_user_tokens(username,refresh_token) values($1,$2)', [user.rows[0].username, refreshToken]);
  
      res.cookie('jwt', refreshToken, {httpOnly: true, sameSite:'none', secure:true, maxAge:24*60*60*1000})
      res.json({ fname,userrole, accessToken });
  
    } catch (error) {
      console.error('Error during user login:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  })

router.get('/refresh', async (req,res) => {
    const cookies = req.cookies;
  
    try {
  
      if(!cookies?.jwt) return res.sendStatus(401);
      const refreshToken = cookies.jwt;
      
      // Retrieve the user from the database based on the provided username
      let user = await pool.query('SELECT * FROM police_user_tokens WHERE refresh_token = $1', [refreshToken]);
  
      if(!user) {
        console.log("No user found")
        return res.sendStatus(403); //Forbidden
      }

      user = await pool.query('SELECT pu.*, po.* FROM police_user pu INNER JOIN police_officer po ON pu.username = po.officerid WHERE pu.username = $1', [user.rows[0].username]);
      
      const userrole = user.rows[0].userrole;
      const fname = user.rows[0].fname;
      // User is authenticated. Generate a JWT token with user information.
      const payload = {
        username: user.rows[0].username,
        userrole: userrole
      };
  
      jwt.verify(
        refreshToken,
        process.env.JWT_TOKEN_SECRET,
        (err,tokenData) =>{
          if(err || user.rows[0].username != tokenData.username) return res.sendStatus(403);
          const accessToken = jwt.sign(
            payload,
            process.env.JWT_TOKEN_SECRET,
            { expiresIn: '15m' }
          )
          res.json({ fname, userrole, accessToken })
        }
      )
  
     
  
    } catch (error) {
      console.error('Error refreshing the token:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  })

module.exports = router;
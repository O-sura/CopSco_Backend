const jwt = require('jsonwebtoken');
const dotenv = require('dotenv').config();

const verifyJWT = (req,res, next) =>{
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if(!authHeader?.startsWith('Bearer ')) return res.sendStatus(401);
    const token = authHeader.split(' ')[1];
    jwt.verify(
        token,
        process.env.JWT_TOKEN_SECRET,
        (err, payload) =>{
            if(err) return res.sendStatus(403); //Invalid token
            req.userData = payload;
            next();  
        }
    )
}

module.exports = verifyJWT;
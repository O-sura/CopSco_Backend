const jwt = require('jsonwebtoken');

const routeProtector = (req,res, next) =>{
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if(!authHeader?.startsWith('Bearer ')) return res.sendStatus(401);
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_TOKEN_SECRET);
        req.user = decoded.userid;
        req.username = decoded.username;
        req.userrole = decoded.userrole;
        next();
    } catch (error) {
        res.status(403).json({ message: 'Invalid token' });
    }
}

module.exports = routeProtector;
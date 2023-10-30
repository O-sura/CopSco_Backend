const jwt = require('jsonwebtoken');

const roleChecker = (requiredRole) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.sendStatus(401);
    }
    
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_TOKEN_SECRET);
      req.user = decoded.userid;
      req.username = decoded.username;
      req.userrole = decoded.userrole;

      // Check if user has the required role
      if (req.userrole !== requiredRole) {
        return res.status(403).json({ message: 'Access denied. Unauthorized role.' });
      }

      next();
    } catch (error) {
      res.status(403).json({ message: 'Invalid token' });
    }
  };
};

module.exports = roleChecker;

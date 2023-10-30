// Custom middleware to check if the user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated) {
      return res.redirect('/homepage');
    } else {
      next();
    }
  };

  module.exports = isAuthenticated;
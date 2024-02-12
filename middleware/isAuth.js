// authMiddleware.js

const isUserLogin = (req, res, next) => {
    if (req.session.userId) {
      next();
    } else {
      req.flash("error", "Please log in to access this page");
      res.redirect("/login");
    }
  };
  
  const isAdminAuth = (req, res, next) => {
    if (req.session.isLogged) {
      next();
    } else {
      req.flash("error", "Please log in as an admin to access this page");
      res.redirect("/admin/admin_login");
    }
  };
  module.exports = {
    isUserLogin,
    isAdminAuth
  }
  
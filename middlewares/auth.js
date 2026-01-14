async function attachAdmin(req, res, next) {
  const token = req.header("Authorization");
  if (!token) return next();

  try {
    const id = token.replace("admin-", "");
    const Admin = require("../models/Admin");
    const admin = await Admin.findById(id);
    if (admin) req.admin = admin;
  } catch (err) {
    console.error(err);
  }
  next();
}

module.exports = attachAdmin;
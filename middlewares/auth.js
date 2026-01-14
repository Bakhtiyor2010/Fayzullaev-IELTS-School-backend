const User = require("../models/User");

// Simple example: req.header("user-id") orqali user attach qilamiz
async function attachUser(req, res, next) {
  const userId = req.header("user-id"); // frontendan user id yuborilishi kerak
  if (!userId) return next(); // user loginsiz bo‘lsa ham davom etadi

  try {
    const user = await User.findById(userId);
    if (user) req.user = user;
    next();
  } catch (err) {
    console.error(err);
    next();
  }
}

module.exports = attachUser;
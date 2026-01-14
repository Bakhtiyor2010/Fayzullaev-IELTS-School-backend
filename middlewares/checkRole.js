function checkRole(allowedRoles) {
  return (req, res, next) => {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Login qiling" });

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: "Sizda ruxsat yo‘q" });
    }

    next();
  };
}

module.exports = checkRole;

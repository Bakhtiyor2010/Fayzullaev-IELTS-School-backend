const express = require("express");
const router = express.Router();
const checkRole = require("../middlewares/checkRole");

router.post("/", checkRole(["superadmin"]), async (req, res) => {
  // Payment kodini shu yerga yozing
  res.json({ message: "Payment ishladi" });
});

module.exports = router;

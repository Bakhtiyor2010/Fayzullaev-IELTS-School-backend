const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");

// LOGIN
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await Admin.findOne({ username, password });
    if (!admin) return res.status(401).json({ error: "Username yoki password xato" });

    const token = "admin-" + admin._id; // oddiy token
    res.json({ token, name: admin.username, role: admin.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server xatosi" });
  }
});

// CURRENT ADMIN
router.get("/me", async (req, res) => {
  try {
    const token = req.header("Authorization"); // frontenddan yuboriladi
    if (!token) return res.status(401).json({ error: "Not logged in" });

    const id = token.replace("admin-", "");
    const admin = await Admin.findById(id);
    if (!admin) return res.status(401).json({ error: "Not logged in" });

    res.json({ username: admin.username, role: admin.role, name: admin.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server xatosi" });
  }
});

module.exports = router;
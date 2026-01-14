// routes/admin.js
const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const admin = await Admin.findOne({ username });
  if (!admin) return res.status(401).json({ error: "Username yoki password xato" });

  // Plain text solishtirish
  if (admin.password !== password)
    return res.status(401).json({ error: "Username yoki password xato" });

  res.json({ message: "Login successful", role: admin.role });
});

module.exports = router;
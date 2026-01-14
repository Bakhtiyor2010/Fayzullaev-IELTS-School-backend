const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username va password kerak' });
  }

  const admin = await Admin.findOne({ username });
  if (!admin) return res.status(401).json({ error: 'Username yoki password xato' });

  // Oddiy plain text solishtirish
  if (admin.password !== password) {
    return res.status(401).json({ error: 'Username yoki password xato' });
  }

  res.json({ message: 'Login muvaffaqiyatli!', role: admin.role });
});

module.exports = router;

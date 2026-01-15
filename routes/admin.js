const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');

// POST /api/admin/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username va password kerak' });
    }

    const admin = await Admin.findOne({ username: username.trim() });
    if (!admin) {
      return res.status(401).json({ error: 'Username yoki password xato' });
    }

    // Plain text tekshiruv
    if (admin.password !== password) {
      return res.status(401).json({ error: 'Username yoki password xato' });
    }

    // Agar superadmin yoki moderator bo‘lsa role yuboriladi
    res.json({ message: 'Login muvaffaqiyatli!', role: admin.role });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatoligi' });
  }
});


module.exports = router;

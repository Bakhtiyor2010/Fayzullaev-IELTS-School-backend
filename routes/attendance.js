const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bot = require("../bot");

// Attendance faqat botga xabar yuborish
router.post("/", async (req, res) => {
  try {
    const { userId, status, message } = req.body;

    if (!userId) return res.status(400).json({ error: "No users selected" });

    const users = await User.find({ _id: { $in: Array.isArray(userId) ? userId : [userId] } });

    for (const u of users) {
      if (!u.telegramId) continue;

      // Agar userga maxsus xabar berilsa, shuni yuboradi, aks holda present/absent xabar
      let msg = message;
      if (!message && status) {
        msg = `Siz bugun ${status === "present" ? "KELDINGIZ" : "KELMADINGIZ"} (${new Date().toLocaleDateString()})`;
      }

      bot.sendMessage(u.telegramId, msg).catch(console.error);
    }

    res.json({ message: "Messages sent ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
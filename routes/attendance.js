const express = require("express");
const router = express.Router();
const usersCollection = require("../models/User");
const bot = require("../bot");

// Attendance qo'shish / Telegram xabar yuborish
router.post("/", async (req, res) => {
  try {
    const { userId, status, message } = req.body;
    if (!userId) return res.status(400).json({ error: "No users selected" });

    // userId lar array bo‘lsa, hammasini ishlatamiz
    const ids = Array.isArray(userId) ? userId : [userId];

    for (const id of ids) {
      const userDoc = await usersCollection.doc(id).get();
      if (!userDoc.exists) continue;

      const u = userDoc.data();
      if (!u.telegramId) continue;

      // 🔹 Xabarni yaratish
      let msg = message;
      if (!message && status) {
        msg = `Assalomu alaykum, ${u.name || ""} ${u.surname || ""} bugun darsda ${
          status === "present" ? "QATNASHDI" : "QATNASHMADI"
        } (${new Date().toLocaleDateString("en-GB")})`;
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
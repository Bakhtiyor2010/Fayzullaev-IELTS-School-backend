const express = require("express");
const router = express.Router();
const usersCollection = require("../models/User"); 
const { addAttendance, getAllAttendance } = require("../models/attendanceService");
const bot = require("../bot");

// POST /api/attendance
router.post("/", async (req, res) => {
  try {
    const { userId, status, message } = req.body;
    if (!userId) return res.status(400).json({ error: "No users selected" });

    const ids = Array.isArray(userId) ? userId : [userId];
    let sentCount = 0;

    for (const id of ids) {
      // 🔹 Firestore query: doc id emas, telegramId bilan topish
      const userSnap = await usersCollection.where("telegramId", "==", id).get();
      if (userSnap.empty) continue;

      const uDoc = userSnap.docs[0];
      const u = uDoc.data();
      if (!u.telegramId || u.status !== "active") continue;

      // 🔹 Attendance qo‘shish
      if (status) {
        await addAttendance(u.telegramId, status, u.name, u.surname);
      }

      // 🔹 Telegram xabar
      let msg = message;
      if (!msg && status) {
        msg = `Assalomu alaykum, hurmatli ${u.name || ""} ${u.surname || ""}.
Bugun darsda ${status === "present" ? "QATNASHDI" : "QATNASHMADI"}.
Sana: ${new Date().toLocaleDateString("en-GB")}`;
      }

      try {
        await bot.sendMessage(u.telegramId, msg);
      } catch (err) {
        console.error(`Failed to send Telegram to ${u.telegramId}:`, err);
      }

      sentCount++;
    }

    res.json({ message: "Messages sent ✅", sent: sentCount });
  } catch (err) {
    console.error("Attendance error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/attendance
router.get("/", async (req, res) => {
  try {
    const attendance = await getAllAttendance();
    res.json(attendance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load attendance" });
  }
});

module.exports = router;

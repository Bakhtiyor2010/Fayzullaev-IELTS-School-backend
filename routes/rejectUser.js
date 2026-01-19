const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();
const bot = require("../bot");

router.delete("/:telegramId", async (req, res) => {
  const { telegramId } = req.params;

  const pendingRef = db.collection("users_pending").doc(telegramId);
  const snap = await pendingRef.get();
  if (!snap.exists)
    return res.status(404).json({ message: "Pending user not found" });

  const data = snap.data();
  await pendingRef.delete();

  // Telegram notify
  try {
    await bot.sendMessage(
      telegramId,
      `Hurmatli ${data.firstName}, sizning ro'yxatdan o'tishingiz rad etildi.
      
      Уважаемый(ая) ${data.firstName}, ваша регистрация была отклонена.`,
    );
  } catch (err) {
    console.error("Telegram notify failed:", err);
  }

  res.json({ message: "User rejected successfully" });
});

module.exports = router;
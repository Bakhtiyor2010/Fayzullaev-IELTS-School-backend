const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();
const bot = require("../bot");

router.post("/:telegramId", async (req, res) => {
  try {
    const { telegramId } = req.params;

    // 1️⃣ Pending user hujjatini olish
    const pendingRef = db.collection("users_pending").doc(telegramId);
    const snap = await pendingRef.get();
    if (!snap.exists) return res.status(404).json({ message: "Pending user not found" });

    const data = snap.data();

    // 2️⃣ groupId to‘g‘ri olish va stringga aylantirish
    const groupId = data.selectedGroupId ? String(data.selectedGroupId) : "";

    // 3️⃣ groupName har doim groups collection dan olish
    let groupName = "";
    if (groupId) {
      const groupDoc = await db.collection("groups").doc(groupId).get();
      if (groupDoc.exists && groupDoc.data().name) {
        groupName = groupDoc.data().name;
      }
    }

    // 4️⃣ Users collection ga yozish
    await db.collection("users").doc(telegramId).set({
      telegramId: data.telegramId,
      name: data.firstName || "",
      surname: data.lastName || "",
      phone: data.phone || "",
      username: data.username || "",
      groupId,
      groupName,
      status: "active",
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 5️⃣ Pending dan o‘chirish
    await pendingRef.delete();

    // 6️⃣ Telegram notify
    try {
      await bot.sendMessage(
        telegramId,
        `Hurmatli ${data.firstName}, siz ${groupName || "guruh"} guruhiga qo‘shildingiz!`
      );
    } catch (err) {
      console.error("Telegram notify failed:", err);
    }

    res.json({ message: "User approved successfully", groupName });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

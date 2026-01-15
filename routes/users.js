const express = require("express");
const router = express.Router();
const usersCollection = require("../models/User");
const bot = require("../bot");

// POST — user qo‘shish (Telegram bot orqali)
router.post("/", async (req, res) => {
  try {
    const { telegramId, username, name, phone, groupId } = req.body;
    if (!telegramId || !name) return res.status(400).json({ error: "telegramId va name majburiy" });

    const snapshot = await usersCollection.doc(String(telegramId)).get();
    if (snapshot.exists) return res.status(200).json({ message: "User already exists" });

    await usersCollection.doc(String(telegramId)).set({
      telegramId,
      username: username || null,
      name,
      phone: phone || null,
      groupId: groupId || null,
      role: "moderator",
      createdAt: new Date()
    });

    try {
      await bot.sendMessage(telegramId, `Salom, hurmatli ${name}! Siz ro‘yxatdan o‘tdingiz.`);
    } catch (err) {
      console.error("Telegram xabar yuborishda xato:", err);
    }

    res.status(201).json({ telegramId, username, name, phone, groupId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET — admin ko‘radi, guruh bo‘yicha filter
router.get("/", async (req, res) => {
  try {
    const { groupId } = req.query;
    let query = usersCollection;
    if (groupId) query = query.where("groupId", "==", groupId);

    const snapshot = await query.get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT — user info yangilash
router.put("/:id", async (req, res) => {
  try {
    await usersCollection.doc(req.params.id).update(req.body);
    const updated = await usersCollection.doc(req.params.id).get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE — user o‘chirish va Telegram xabar
router.delete("/:id", async (req, res) => {
  try {
    const docRef = usersCollection.doc(req.params.id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return res.status(404).json({ error: "User not found" });

    const userData = docSnap.data();
    await docRef.delete();

    if (userData.telegramId) {
      try {
        await bot.sendMessage(
          userData.telegramId,
          `Hurmatli ${userData.name}, siz tizimdan o'chirildingiz. Qayta ro'yxatdan o'tish uchun /start ni bosing!`
        );
      } catch (err) {
        console.error("Telegram notify failed:", err);
      }
    }

    res.json({ success: true, message: "User deleted and notification sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete user or send notification" });
  }
});

module.exports = router;
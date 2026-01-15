const express = require("express");
const router = express.Router();
const groupsCollection = require("../models/Group");
const usersCollection = require("../models/User");
const bot = require("../bot");

// GET — barcha guruhlar
router.get("/", async (req, res) => {
  try {
    const snapshot = await groupsCollection.get();
    const groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST — group yaratish
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name required" });

    const newGroupRef = groupsCollection.doc();
    await newGroupRef.set({ name, createdAt: new Date() });

    res.json({ id: newGroupRef.id, name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT — group nomini tahrirlash
router.put("/:id", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name required" });

    await groupsCollection.doc(req.params.id).update({ name });

    // Telegram xabari
    const usersSnapshot = await usersCollection.where("groupId", "==", req.params.id).get();
    for (const doc of usersSnapshot.docs) {
      const user = doc.data();
      if (user.telegramId) {
        await bot.sendMessage(user.telegramId, `ℹ️ Sizning guruh nomingiz "${name}" ga o'zgartirildi.`);
      }
    }

    res.json({ id: req.params.id, name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE — guruhni o'chirish + userlarni o'chirish + xabar
router.delete("/:id", async (req, res) => {
  try {
    const groupId = req.params.id;

    // 🔹 1️⃣ Guruhni o'chirish
    await groupsCollection.doc(groupId).delete();

    // 🔹 2️⃣ Guruhga tegishli userlar
    const usersSnapshot = await usersCollection.where("groupId", "==", groupId).get();

    const deletePromises = [];
    for (const doc of usersSnapshot.docs) {
      const user = doc.data();

      // Telegramga xabar yuborish (xatolikni frontendga bermaymiz)
      if (user.telegramId) {
        deletePromises.push(
          bot.sendMessage(user.telegramId, `⚠️ Hurmatli ${user.name}, sizning guruhingiz o‘chirildi va tizimdan olib tashlandingiz.`)
            .catch(err => console.error("Notification failed:", err))
        );
      }

      // Userni o'chirish
      deletePromises.push(usersCollection.doc(doc.id).delete());
    }

    await Promise.all(deletePromises);

    res.json({ message: "Group and its users deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete group and users" });
  }
});

module.exports = router;

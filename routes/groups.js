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

// PUT — group nomini tahrirlash va userlarga xabar
router.put("/:id", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name required" });

    await groupsCollection.doc(req.params.id).update({ name });

    const usersSnapshot = await usersCollection.where("groupId", "==", req.params.id).get();
    for (const doc of usersSnapshot.docs) {
      const user = doc.data();
      if (user.telegramId) {
        await bot.sendMessage(user.telegramId, `ℹ️ Sizning guruh nomingiz "${name}" ga o'zgartirildi.`).catch(console.error);
      }
    }

    res.json({ id: req.params.id, name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE — guruh + userlar + xabar
router.delete("/:id", async (req, res) => {
  try {
    const groupId = req.params.id;
    await groupsCollection.doc(groupId).delete();

    const usersSnapshot = await usersCollection.where("groupId", "==", groupId).get();
    const promises = [];
    for (const doc of usersSnapshot.docs) {
      const user = doc.data();
      if (user.telegramId) {
        promises.push(bot.sendMessage(user.telegramId, `⚠️ Hurmatli ${user.firstName}, sizning guruhingiz o‘chirildi.`).catch(console.error));
      }
      promises.push(usersCollection.doc(doc.id).delete());
    }

    await Promise.all(promises);
    res.json({ message: "Group and its users deleted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete group and users" });
  }
});

module.exports = router;

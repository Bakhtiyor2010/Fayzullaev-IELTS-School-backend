const express = require("express");
const router = express.Router();
const { setPaid, setUnpaid, getAllPayments } = require("../models/paymentService");
const bot = require("../bot");

// 🔹 PAID
router.post("/paid", async (req, res) => {
  try {
    const { userId, name, surname } = req.body;
    if (!userId || !name || !surname)
      return res.status(400).json({ error: "userId, name and surname required" });

    const { paidAt } = await setPaid(userId, name, surname);

    // 🔹 Telegramga xabar
    if (bot) {
      await bot.sendMessage(
        userId,
        `Assalomu alaykum, hurmatli ${name} ${surname}!\nTo‘lov qabul qilindi (📅 ${formatDate(
          paidAt
        )})`
      );
    }

    res.json({ success: true, paidAt });
  } catch (err) {
    console.error("PAID ERROR:", err);
    res.status(500).json({ error: err.message || "Paid failed" });
  }
});

// 🔹 UNPAID
router.post("/unpaid", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });

    await setUnpaid(userId);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Unpaid failed" });
  }
});

// 🔹 GET all payments
router.get("/", async (req, res) => {
  try {
    const payments = await getAllPayments();
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load payments" });
  }
});

function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

module.exports = router;

const express = require("express");
const router = express.Router();
const {
  setPaid,
  setUnpaid,
  deletePayment,
  getAllPayments,
} = require("../models/paymentService");
const bot = require("../bot");

// 🔹 PAID
router.post("/paid", async (req, res) => {
  try {
    const { userId, name, surname } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });
    if (!name || !surname)
      return res.status(400).json({ error: "name and surname required" });

    const { paidAt } = await setPaid(userId, name, surname);

    // 🔹 Telegram xabar
    try {
      await bot.sendMessage(
        userId,
        `Assalomu alaykum, hurmatli ${name} ${surname}!\nTo‘lov qabul qilindi. (📅 ${formatDate(
          paidAt
        )})`
      );
    } catch (err) {
      console.error("Bot message ERROR:", err);
    }

    res.json({ success: true, paidAt });
  } catch (err) {
    console.error("PAID ERROR:", err);
    res.status(500).json({ error: "Paid failed" });
  }
});

// 🔹 UNPAID
router.post("/unpaid", async (req, res) => {
  try {
    const { userId, name, surname } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });

    await setUnpaid(userId);

    try {
      await bot.sendMessage(
        userId,
        `Hurmatli ${name || ""} ${surname || ""}!\nIltimos, to‘lovni tezroq amalga oshiring.`
      );
    } catch (err) {
      console.error("Bot message ERROR:", err);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("UNPAID ERROR:", err);
    res.status(500).json({ error: "Unpaid failed" });
  }
});

// 🔹 DELETE payment
router.delete("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    await deletePayment(userId);

    try {
      await bot.sendMessage(
        userId,
        `Hurmatli foydalanuvchi!\nTo‘lov tarixingiz o‘chirildi.`
      );
    } catch (err) {
      console.error("Bot message ERROR:", err);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

// 🔹 GET all payments
router.get("/", async (req, res) => {
  try {
    const payments = await getAllPayments();
    res.json(payments);
  } catch (err) {
    console.error("GET ERROR:", err);
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

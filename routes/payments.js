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
    if (!userId || !name || !surname)
      return res
        .status(400)
        .json({ error: "userId, name and surname required" });

    const { paidAt } = await setPaid(userId, name, surname);

    // 🔹 Telegramga xabar
    if (bot) {
      const monthName = getMonthName(paidAt);
      const russianMonthName = getRussianMonthName(paidAt);

      await bot.sendMessage(
        userId,
        `Assalomu alaykum, hurmatli ${name} ${surname}!\n${monthName} oyi kurs to‘lovi qabul qilindi (📅 ${formatDate(paidAt)})
        
Здравствуйте, уважаемый(ая) ${name} ${surname}!\nОплата курса за ${russianMonthName} принята (📅 ${formatDate(paidAt)})`,
      );
    }

    res.json({ success: true, paidAt });
  } catch (err) {
    console.error("PAID ERROR:", err);
    res.status(500).json({ error: err.message || "Paid failed" });
  }
});

// 🔹 Helper: oy nomi olish
function getMonthName(date) {
  const months = [
    "Yanvar",
    "Fevral",
    "Mart",
    "Aprel",
    "May",
    "Iyun",
    "Iyul",
    "Avgust",
    "Sentabr",
    "Oktyabr",
    "Noyabr",
    "Dekabr",
  ];
  const d = new Date(date);
  return months[d.getMonth()];
}

// 🔹 Helper: rus oy nomi olish
function getRussianMonthName(date) {
  const months = [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
  ];
  const d = new Date(date);
  return months[d.getMonth()];
}

// 🔹 UNPAID
router.post("/unpaid", async (req, res) => {
  try {
    const { userId, name, surname } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });

    await setUnpaid(userId);

    // 🔹 Telegramga xabar
    if (bot) {
      await bot.sendMessage(
        userId,
        `Hurmatli ${name || ""} ${surname || ""}!\nIltimos, to‘lovni tezroq amalga oshiring.
        
Уважаемый(ая) ${name || ""} ${surname || ""}!\nПожалуйста, произведите оплату как можно скорее.`,
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("UNPAID ERROR:", err);
    res.status(500).json({ error: err.message || "Unpaid failed" });
  }
});

// 🔹 DELETE payment
router.delete("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, surname } = req.body; // frontenddan yuborilsa

    await deletePayment(userId);

    // 🔹 Telegramga xabar
    if (bot) {
      await bot.sendMessage(
        userId,
        `Hurmatli ${name || ""} ${surname || ""}!\nTo‘lov tarixingiz o‘chirildi.
        
Уважаемый(ая) ${name || ""} ${surname || ""}!\nВаша история платежей была удалена.`,
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ error: err.message || "Delete failed" });
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
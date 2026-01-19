const admin = require("firebase-admin");
const db = admin.firestore();

// 🔹 Attendance qo‘shish (bugungi sana uchun oxirgi holat saqlanadi)
async function addAttendance(telegramId, status, name, surname) {
  if (!telegramId || !status) throw new Error("Invalid attendance data");

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const docRef = db.collection("attendance").doc(String(telegramId));
  const doc = await docRef.get();

  let history = [];
  if (doc.exists && Array.isArray(doc.data().history)) history = doc.data().history;

  // 🔹 Bugungi sana mavjudmi tekshirish
  const todayIndex = history.findIndex(h => h.day === today);

  const record = {
    day: today,                // kun bo‘yicha unique
    status,
    name: name || "",
    surname: surname || "",
    updatedAt: admin.firestore.Timestamp.now(), // sana
  };

  if (todayIndex !== -1) history[todayIndex] = record; // mavjud bo‘lsa update
  else history.push(record);                             // yo‘q bo‘lsa push

  await docRef.set({ history }, { merge: true });

  return record;
}

// 🔹 Barcha attendancelarni olish (frontend bilan mos)
async function getAllAttendance() {
  const snap = await db.collection("attendance").get();
  const result = [];

  snap.forEach(doc => {
    const data = doc.data();
    if (!data.history) return;

    data.history.forEach(h => {
      result.push({
        telegramId: doc.id,
        name: h.name,
        surname: h.surname,
        status: h.status,
        date: h.updatedAt instanceof admin.firestore.Timestamp
          ? h.updatedAt.toDate()
          : new Date(h.updatedAt),
      });
    });
  });

  return result;
}

// 🔹 Bitta foydalanuvchi uchun history olish
async function getUserAttendance(userId) {
  if (!userId) return [];
  const docRef = db.collection("attendance").doc(userId);
  const doc = await docRef.get();
  if (!doc.exists) return [];

  const data = doc.data();
  return data.history
    ? data.history.map(h => ({
        status: h.status,
        name: h.name,
        surname: h.surname,
        date: h.updatedAt instanceof admin.firestore.Timestamp
          ? h.updatedAt.toDate()
          : new Date(h.updatedAt),
      }))
    : [];
}

module.exports = {
  addAttendance,
  getAllAttendance,
  getUserAttendance,
};
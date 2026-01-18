const admin = require("firebase-admin");
const db = admin.firestore();

// 🔹 Payment qo‘shish
async function setPaid(userId, name, surname) {
  if (!userId || !name || !surname)
    throw new Error("userId, name and surname are required");

  const paidAt = admin.firestore.Timestamp.now();
  const docRef = db.collection("payments").doc(userId);
  const doc = await docRef.get();

  const record = { name, surname, paidAt };

  if (doc.exists) {
    await docRef.update({
      paidAt,
      history: admin.firestore.FieldValue.arrayUnion(record),
    });
  } else {
    await docRef.set({
      paidAt,
      history: [record],
    });
  }

  return { paidAt: paidAt.toDate() };
}

// 🔹 To‘lovni o‘chirish
async function setUnpaid(userId) {
  if (!userId) throw new Error("userId required");
  await db.collection("payments").doc(userId).delete();
}

// 🔹 Barcha paymentlarni olish
async function getAllPayments() {
  const snap = await db.collection("payments").get();
  const payments = {};

  snap.forEach((doc) => {
    const data = doc.data();
    payments[doc.id] = {
      paidAt: data.paidAt ? data.paidAt.toDate() : null,
      history: data.history
        ? data.history.map((h) => ({
            name: h.name,
            surname: h.surname,
            paidAt: h.paidAt ? h.paidAt.toDate() : null,
          }))
        : [],
    };
  });

  return payments;
}

module.exports = { setPaid, setUnpaid, getAllPayments };

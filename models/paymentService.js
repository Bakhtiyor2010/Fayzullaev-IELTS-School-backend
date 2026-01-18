const admin = require("firebase-admin");
const db = admin.firestore();

// 🔹 Payment qo‘shish
async function setPaid(userId, name = "", surname = "") {
  const paidAt = admin.firestore.FieldValue.serverTimestamp();
  const docRef = db.collection("payments").doc(userId);

  try {
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

    return { paidAt: new Date() };
  } catch (err) {
    console.error("setPaid ERROR:", err);
    throw err;
  }
}

// 🔹 To‘lovni o‘chirish
async function setUnpaid(userId) {
  try {
    await db.collection("payments").doc(userId).delete();
  } catch (err) {
    console.error("setUnpaid ERROR:", err);
    throw err;
  }
}

// 🔹 Payment o‘chirish
async function deletePayment(userId) {
  try {
    await db.collection("payments").doc(userId).delete();
  } catch (err) {
    console.error("deletePayment ERROR:", err);
    throw err;
  }
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
            name: h.name || "",
            surname: h.surname || "",
            paidAt: h.paidAt ? h.paidAt.toDate() : null,
          }))
        : [],
    };
  });

  return payments;
}

module.exports = {
  setPaid,
  setUnpaid,
  deletePayment,
  getAllPayments,
};

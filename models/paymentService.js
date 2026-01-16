const admin = require("firebase-admin");
const db = admin.firestore();

async function setPaid(userId) {
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  await db.collection("payments").doc(userId).set({
    status: "paid",
    startDate,
    endDate,
    createdAt: new Date(),
  });

  return { startDate, endDate };
}

async function setUnpaid(userId) {
  await db.collection("payments").doc(userId).set({
    status: "unpaid",
    startDate: null,
    endDate: null,
    createdAt: new Date(),
  });
}

async function deletePayment(userId) {
  await db.collection("payments").doc(userId).delete();
}

// 🔹 BU YERDA TIMESTAMP-LARNI DATE GA O‘ZGARTIRAMIZ
async function getAllPayments() {
  const snap = await db.collection("payments").get();
  const payments = {};

  snap.forEach(doc => {
    const data = doc.data();
    payments[doc.id] = {
      ...data,
      startDate: data.startDate ? data.startDate.toDate() : null,
      endDate: data.endDate ? data.endDate.toDate() : null,
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
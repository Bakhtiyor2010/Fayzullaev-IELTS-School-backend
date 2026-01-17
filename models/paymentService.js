const admin = require("firebase-admin");
const db = admin.firestore();

async function setPaid(userId) {
  const paidAt = new Date();

  await db.collection("payments").doc(userId).set({
    paidAt,
    createdAt: new Date(),
  });

  return { paidAt };
}

async function setUnpaid(userId) {
  await db.collection("payments").doc(userId).delete();
}

async function deletePayment(userId) {
  await db.collection("payments").doc(userId).delete();
}

async function getAllPayments() {
  const snap = await db.collection("payments").get();
  const payments = {};

  snap.forEach(doc => {
    const data = doc.data();
    payments[doc.id] = {
      paidAt: data.paidAt ? data.paidAt.toDate() : null,
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
const admin = require("firebase-admin");
const db = admin.firestore();

/**
 * Foydalanuvchini pending users ga qo'shish
 * @param {Object} userData - { telegramId, firstName, lastName, phone, username, selectedGroupId }
 */
async function createPendingUser(userData) {
  if (!userData.telegramId || !userData.firstName) {
    throw new Error("telegramId va firstName majburiy");
  }

  // 🔹 selectedGroupId majburiy qilamiz
  if (!userData.selectedGroupId) {
    throw new Error("selectedGroupId majburiy");
  }

  const groupId = String(userData.selectedGroupId); // stringga aylantiramiz

  // 🔹 groupName groups collection dan olish
  let groupName = "";
  const groupDoc = await db.collection("groups").doc(groupId).get();
  if (groupDoc.exists && groupDoc.data().name) {
    groupName = groupDoc.data().name;
  } else {
    throw new Error("Group topilmadi");
  }

  const ref = db.collection("users_pending").doc(String(userData.telegramId));
  await ref.set({
    telegramId: userData.telegramId,
    firstName: userData.firstName,
    lastName: userData.lastName || "",
    phone: userData.phone || "",
    username: userData.username || "",
    selectedGroupId: groupId,
    groupName,          // to‘g‘ri groupName
    status: "pending",
    createdAt: new Date(),
  });

  return { telegramId: userData.telegramId, groupId, groupName };
}

module.exports = { createPendingUser };

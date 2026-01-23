const admin = require("firebase-admin");
const db = admin.firestore();

async function authMiddleware(req, res, next) {
  try {
    // Frontend Authorization header: "Bearer <adminId>"
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const adminDoc = await db.collection("admins").doc(token).get();
    if (!adminDoc.exists) return res.status(401).json({ error: "Unauthorized" });

    req.user = adminDoc.data(); // shu yerda req.user.username mavjud bo‘ladi
    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = authMiddleware;

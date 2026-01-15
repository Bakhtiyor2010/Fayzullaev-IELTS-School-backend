const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  role: { type: String, enum: ["superadmin", "moderator"], required: true },
});

// Bu yerda collection nomini "datas" qilib belgilaymiz
module.exports = mongoose.model("Admin", adminSchema, "datas");

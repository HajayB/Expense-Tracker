const mongoose = require("mongoose");

const blacklistedTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now, expires: "7d" }, // auto-deleted after 7 days (matches JWT expiry)
});

module.exports = mongoose.model("BlacklistedToken", blacklistedTokenSchema);

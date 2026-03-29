const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["income", "expense", "both"],
      default: "both",
    },
    icon: {
      type: String,
      default: "💰",
    },
  },
  { timestamps: true }
);

categorySchema.index({ userId: 1 });

module.exports = mongoose.model("Category", categorySchema);

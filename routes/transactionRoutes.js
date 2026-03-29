const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { createTransactionSchema, updateTransactionSchema } = require("../validators/transactionValidators");
const {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getSummary,
} = require("../controllers/transactionController");

router.post("/", protect, validate(createTransactionSchema), createTransaction);
router.get("/", protect, getTransactions);
router.get("/summary", protect, getSummary);
router.get("/:id", protect, getTransactionById);
router.put("/:id", protect, validate(updateTransactionSchema), updateTransaction);
router.delete("/:id", protect, deleteTransaction);

module.exports = router;

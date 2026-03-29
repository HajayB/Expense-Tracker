const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { createCategorySchema, updateCategorySchema } = require("../validators/categoryValidators");
const {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

router.post("/", protect, validate(createCategorySchema), createCategory);
router.get("/", protect, getCategories);
router.put("/:id", protect, validate(updateCategorySchema), updateCategory);
router.delete("/:id", protect, deleteCategory);

module.exports = router;

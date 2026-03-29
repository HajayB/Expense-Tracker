const Category = require("../models/categoryModel");

// Create a category
exports.createCategory = async (req, res) => {
  try {
    const { name, type, icon } = req.body; // validated by Zod middleware

    const existing = await Category.findOne({ userId: req.user._id, name: new RegExp(`^${name}$`, "i") });
    if (existing)
      return res.status(400).json({ message: "Category already exists" });

    const category = await Category.create({ userId: req.user._id, name, type, icon });
    res.status(201).json({ message: "Category created", category });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all categories for logged-in user
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ userId: req.user._id }).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update a category
exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!category)
      return res.status(404).json({ message: "Category not found" });

    res.json({ message: "Category updated", category });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!category)
      return res.status(404).json({ message: "Category not found" });

    res.json({ message: "Category deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

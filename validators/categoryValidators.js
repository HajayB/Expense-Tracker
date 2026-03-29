const { z } = require("zod");

exports.createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").trim(),
  type: z.enum(["income", "expense", "both"]).default("both"),
  icon: z.string().optional(),
});

exports.updateCategorySchema = z.object({
  name: z.string().min(1).trim().optional(),
  type: z.enum(["income", "expense", "both"]).optional(),
  icon: z.string().optional(),
});

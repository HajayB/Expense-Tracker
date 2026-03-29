const { z } = require("zod");

exports.createTransactionSchema = z.object({
  amount: z.coerce.number({ invalid_type_error: "Amount must be a number" }).positive("Amount must be greater than 0"),
  type: z.enum(["income", "expense"], { error: "Type must be 'income' or 'expense'" }),
  category: z.string().min(1, "Category is required").trim(),
  description: z.string().trim().optional(),
  date: z.coerce.date().optional(),
});

exports.updateTransactionSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0").optional(),
  type: z.enum(["income", "expense"], { error: "Type must be 'income' or 'expense'" }).optional(),
  category: z.string().min(1).trim().optional(),
  description: z.string().trim().optional(),
  date: z.coerce.date().optional(),
});

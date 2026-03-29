const Transaction = require("../models/transactionModel");

// Create a new transaction
exports.createTransaction = async (req, res) => {
  try {
    const { amount, type, category, description, date } = req.body;

    const transaction = await Transaction.create({
      userId: req.user._id,
      amount,
      type,
      category,
      description,
      date,
    });

    res.status(201).json({ message: "Transaction added successfully", transaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all transactions for logged-in user (paginated + filterable)
exports.getTransactions = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip  = (page - 1) * limit;

    const filter = { userId: req.user._id };

    // Filter by type
    if (req.query.type && ["income", "expense"].includes(req.query.type)) {
      filter.type = req.query.type;
    }

    // Search by description or category (case-insensitive)
    if (req.query.search?.trim()) {
      const regex = new RegExp(req.query.search.trim(), "i");
      filter.$or = [{ description: regex }, { category: regex }];
    }

    // Filter by date range
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate)   filter.date.$lte = new Date(req.query.endDate + "T23:59:59");
    }

    const [total, transactions] = await Promise.all([
      Transaction.countDocuments(filter),
      Transaction.find(filter).sort({ date: -1 }).skip(skip).limit(limit),
    ]);

    res.json({
      transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get a single transaction
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user._id });
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });
    res.json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update a transaction
exports.updateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });
    res.json({ message: "Transaction updated successfully", transaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a transaction
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });
    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get financial summary with optional date range + monthly breakdown (last 6 months)
exports.getSummary = async (req, res) => {
  try {
    const dateFilter = {};
    if (req.query.startDate || req.query.endDate) {
      dateFilter.date = {};
      if (req.query.startDate) dateFilter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate)   dateFilter.date.$lte = new Date(req.query.endDate + "T23:59:59");
    }

    // Fetch filtered transactions (for stats/charts) and all transactions (for monthly)
    const [filtered, all] = await Promise.all([
      Transaction.find({ userId: req.user._id, ...dateFilter }),
      Transaction.find({ userId: req.user._id }),
    ]);

    const income   = filtered.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expenses = filtered.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

    const expensesByCategory = {};
    filtered.filter(t => t.type === "expense").forEach(t => {
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
    });

    // Monthly breakdown — always last 6 months regardless of date filter
    const monthly = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const year  = d.getFullYear();
      const month = d.getMonth();
      const label = d.toLocaleString("default", { month: "short", year: "2-digit" });

      const inMonth = (t) => {
        const td = new Date(t.date);
        return td.getFullYear() === year && td.getMonth() === month;
      };

      monthly.push({
        label,
        income:   all.filter(t => t.type === "income"  && inMonth(t)).reduce((s, t) => s + t.amount, 0),
        expenses: all.filter(t => t.type === "expense" && inMonth(t)).reduce((s, t) => s + t.amount, 0),
      });
    }

    res.status(200).json({
      income,
      expenses,
      balance: income - expenses,
      totalTransactions: filtered.length,
      expensesByCategory,
      monthly,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

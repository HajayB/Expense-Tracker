const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// API Routes
const userRoutes = require("./routes/userRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const categoryRoutes = require("./routes/categoryRoutes");

app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/categories", categoryRoutes);

// Frontend page routes
app.get("/api/users/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "signUp.html"));
});

app.get("/api/users/signin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "signIn.html"));
});

app.get("/api/users/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

app.get("/api/users/transactions", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "transactions.html"));
});

app.get("/api/users/summary", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "summary.html"));
});

app.get("/api/users/categories", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "categories.html"));
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server error", error: err.message });
});

const PORT = process.env.PORT || 3800;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

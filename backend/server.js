const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const expenseRoutes = require("./routes/expenseRoutes");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/expenses", expenseRoutes);

app.get("/", (req, res) => {
  res.send("Expense Tracker Backend is Running!");
});

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ message: "Request body must be valid JSON" });
  }
  console.error(error);
  return res.status(500).json({ message: "An unexpected server error occurred" });
});

const startServer = async () => {
  const port = process.env.PORT || 5000;

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required. Add it to backend/.env before starting the server.");
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected successfully");

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  });
}

module.exports = { app, startServer };
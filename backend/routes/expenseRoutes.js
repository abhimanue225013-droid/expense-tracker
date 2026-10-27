const express = require("express");
const mongoose = require("mongoose");
const Expense = require("../models/Expense");

const router = express.Router();
const categories = ["Food", "Travel", "Bills", "Shopping", "Other"];

const validateExpense = ({ title, amount, category, date }) => {
  if (typeof title !== "string" || !title.trim() || amount === undefined || amount === "" || !category || !date) {
    return "All fields are required";
  }

  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    return "Amount must be a number greater than 0";
  }

  if (!categories.includes(category)) {
    return "Choose a valid expense category";
  }

  if (Number.isNaN(new Date(date).getTime())) {
    return "Choose a valid expense date";
  }

  return null;
};

// GET all expenses
router.get("/", async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch expenses" });
  }
});

// ADD expense
router.post("/", async (req, res) => {
  try {
    const { title, amount, category, date } = req.body || {};
    const validationMessage = validateExpense({ title, amount, category, date });
    if (validationMessage) return res.status(400).json({ message: validationMessage });

    const expense = await Expense.create({
      title: title.trim(),
      amount: Number(amount),
      category,
      date,
    });

    res.status(201).json(expense);
  } catch (error) {
    if (error.name === "ValidationError") return res.status(400).json({ message: error.message });
    res.status(500).json({ message: "Failed to add expense" });
  }
});

// UPDATE expense
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid expense ID",
      });
    }

    const { title, amount, category, date } = req.body || {};
    const validationMessage = validateExpense({ title, amount, category, date });
    if (validationMessage) return res.status(400).json({ message: validationMessage });

    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        title: title.trim(),
        amount: Number(amount),
        category,
        date,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!expense) {
      return res.status(404).json({
        message: "Expense not found",
      });
    }

    res.json(expense);
  } catch (error) {
    if (error.name === "ValidationError") return res.status(400).json({ message: error.message });
    res.status(500).json({ message: "Failed to update expense" });
  }
});

// DELETE expense
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid expense ID",
      });
    }

    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({
        message: "Expense not found",
      });
    }

    res.json({
      message: "Expense deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete expense",
    });
  }
});

module.exports = router;
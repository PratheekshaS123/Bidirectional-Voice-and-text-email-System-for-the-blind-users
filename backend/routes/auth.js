
const express = require("express");
const User = require("../models/User");
const LoggedInUser = require("../models/LoggedInUser");
const nodemailer = require("nodemailer");
const router = express.Router();

// Signup
router.post("/signup", async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email.trim().toLowerCase();
    password = password.trim();

    const existing = await User.findOne({ email });
    if (existing) return res.json({ success: false, message: "User already exists" });

    const newUser = new User({ email, password });
    await newUser.save();
    res.json({ success: true, message: "Signup successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email.trim().toLowerCase();
    password = password.trim();

    const user = await User.findOne({ email });
    if (!user) return res.json({ success: false, message: "Email does not exist" });
    if (user.password !== password) return res.json({ success: false, message: "Invalid credentials" });

    // Store logged-in user
    await LoggedInUser.deleteMany({});
    const loggedIn = new LoggedInUser({ email, password });
    await loggedIn.save();

    // Send login confirmation
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: email, pass: password },
    });

    await transporter.sendMail({
      from: email,
      to: email,
      subject: "Login Confirmation",
      text: "You are logged in successfully and redirected to menu.",
    });

    res.json({ success: true, email: user.email, password: user.password, message: "Login successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get logged-in user
router.get("/loggedin", async (req, res) => {
  try {
    const user = await LoggedInUser.findOne();
    if (!user) return res.json({ success: false, message: "No user logged in" });
    res.json({ success: true, email: user.email, password: user.password });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;

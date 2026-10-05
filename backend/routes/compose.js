
const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const LoggedInUser = require("../models/LoggedInUser");
const SentEmail = require("../models/sentEmail"); // lowercase s ✅

// POST /api/compose/send
router.post("/send", async (req, res) => {
  const { to, subject, body } = req.body;

  try {
    const loggedUser = await LoggedInUser.findOne();
    if (!loggedUser) {
      return res.status(400).json({ success: false, message: "No logged-in user" });
    }

    const { email: fromEmail, password } = loggedUser;

    if (!to || !subject || !body) {
      return res.status(400).json({ success: false, message: "Missing recipient, subject, or body" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: fromEmail,
        pass: password,
      },
    });

    const mailOptions = { from: fromEmail, to, subject, text: body };
    await transporter.sendMail(mailOptions);

    // ✅ Save to MongoDB Sent collection
    const sentMail = new SentEmail({ from: fromEmail, to, subject, body });
    await sentMail.save();

    res.json({ success: true, message: `Email sent successfully to ${to}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to send email. " + err.message });
  }
});

module.exports = router;

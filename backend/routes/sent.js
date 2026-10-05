// const express = require("express");
// const router = express.Router();
// const SentEmail = require("../models/sentEmail");

// // GET /api/sent
// router.get("/", async (req, res) => {
//   try {
//     const emails = await SentEmail.find().sort({ date: -1 });
//     res.json({ success: true, emails });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Failed to fetch sent emails." });
//   }
// });

// module.exports = router;
const express = require("express");
const router = express.Router();
const SentEmail = require("../models/sentEmail");
const LoggedInUser = require("../models/LoggedInUser");

// GET /api/sent
router.get("/", async (req, res) => {
  try {
    // 🔹 Get the currently logged-in user
    const loggedUser = await LoggedInUser.findOne();
    if (!loggedUser) {
      return res.status(400).json({ success: false, message: "No logged-in user found" });
    }

    // 🔹 Fetch only emails sent by this user
    const emails = await SentEmail.find({ from: loggedUser.email }).sort({ date: -1 });

    res.json({ success: true, emails });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch sent emails." });
  }
});

module.exports = router;

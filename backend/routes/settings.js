const express = require("express");
const router = express.Router();
const loudness = require("loudness");
const brightness = require("brightness");

// ----------------------------
// SET VOLUME
// ----------------------------
router.post("/set-volume", async (req, res) => {
  try {
    let vol = Number(req.body.volume); // percentage 0–100

    if (isNaN(vol) || vol < 0 || vol > 100) {
      return res.status(400).json({ message: "Invalid volume" });
    }

    await loudness.setVolume(vol);
    res.json({ message: `Volume set to ${vol}%` });
  } catch (err) {
    console.error("Volume error:", err);
    res.status(500).json({ message: "Server error while setting volume" });
  }
});

// ----------------------------
// SET BRIGHTNESS
// ----------------------------
router.post("/set-brightness", async (req, res) => {
  try {
    let level = Number(req.body.brightness); // percentage

    if (isNaN(level) || level < 0 || level > 100) {
      return res.status(400).json({ message: "Invalid brightness" });
    }

    await brightness.set(level / 100); // convert to 0-1 scale

    res.json({ message: `Brightness set to ${level}%` });
  } catch (err) {
    console.error("Brightness error:", err);
    res.status(500).json({ message: "Server error while setting brightness" });
  }
});

module.exports = router;

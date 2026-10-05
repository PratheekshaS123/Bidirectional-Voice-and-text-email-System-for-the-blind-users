
const mongoose = require("mongoose");

const sentEmailSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("SentEmail", sentEmailSchema);


const mongoose = require("mongoose");

const LoggedInUserSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
});

module.exports = mongoose.model("LoggedInUser", LoggedInUserSchema);

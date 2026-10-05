
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const composeRoutes = require("./routes/compose");
const sentRoutes = require("./routes/sent");
const inboxRoutes = require("./routes/inbox");
const settingsRoute = require("./routes/settings");
const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/voice_email", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

app.use("/api/auth", authRoutes);
app.use("/api/compose", composeRoutes);
app.use("/api/sent", sentRoutes);
app.use("/api/inbox", inboxRoutes);
app.use("/settings", settingsRoute);


app.listen(5000, () => console.log("🚀 Server running on http://localhost:5000"));

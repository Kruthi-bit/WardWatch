require("dotenv").config();
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

const express = require("express");
const cors = require("cors");

const userRoutes = require("./routes/users");
const complaintRoutes = require("./routes/complaints");
const aiRoutes = require("./routes/ai");

require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/complaints", complaintRoutes);
app.use("/api/users", userRoutes);
app.use("/api/ai", aiRoutes);

const PORT = 5000;

app.get("/", (req, res) => {
  res.send("WardWatch backend is running");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("Gemini AI triage route enabled");
});
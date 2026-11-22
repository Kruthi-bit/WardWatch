const express = require("express");
const cors = require("cors");
const userRoutes = require("./routes/users");
const complaintRoutes = require("./routes/complaints");
require("./db");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/complaints",complaintRoutes);
app.use("/api/users", userRoutes);

const PORT = 5000;

app.get("/", (req, res) => {
  res.send("WardWatch backend is running");
});



app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("NEW PATCH SERVER");
});

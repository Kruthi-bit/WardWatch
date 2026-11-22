const express = require("express");
const router = express.Router();
const db = require("../db");
router.post("/register", (req, res) => {
  const { full_name, mobile_number, email, ward } = req.body;

  const sql = `
    INSERT INTO users (full_name, mobile_number, email, ward)
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    sql,
    [full_name, mobile_number, email, ward],
    (err, result) => {
      if (err) {
        console.error("Registration error:", err);
        return res.status(500).json({
          message: "Registration failed"
        });
      }

      res.status(201).json({
        message: "Registration successful",
        userId: result.insertId
      });
    }
  );
});
router.post("/login", (req, res) => {
  const { mobile_number } = req.body;

  const sql = "SELECT * FROM users WHERE mobile_number = ?";

  db.query(sql, [mobile_number], (err, results) => {
    if (err) {
      console.error("Login error:", err);
      return res.status(500).json({
        message: "Database error",
      });
    }

    if (results.length === 0) {
      return res.status(401).json({
        message: "Invalid mobile number",
      });
    }

    res.json({
      message: "Login successful",
      user: results[0],
    });
  });
});
module.exports = router;
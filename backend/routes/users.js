const express = require("express");
const router = express.Router();
const db = require("../db");
router.post("/register", (req, res) => {
  const { full_name, mobile_number, email, ward } = req.body;

  if (!full_name || !mobile_number || !email || !ward) {
    return res.status(400).json({
      message: "Full name, mobile number, email and ward are required",
    });
  }

  if (!/^\d{10}$/.test(String(mobile_number))) {
    return res.status(400).json({
      message: "Mobile number must contain exactly 10 digits",
    });
  }

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

        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({
            message: "An account with this mobile number or email already exists",
          });
        }

        return res.status(500).json({
          message: "Registration failed"
        });
      }

      res.status(201).json({
        message: "Registration successful",
        userId: result.insertId,
        user: {
          id: result.insertId,
          full_name,
          mobile_number,
          email,
          ward,
          role: "citizen",
        },
      });
    }
  );
});
router.post("/login", (req, res) => {
  const { mobile_number } = req.body;

  if (!mobile_number) {
    return res.status(400).json({
      message: "Mobile number is required",
    });
  }

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

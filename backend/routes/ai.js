const express = require("express");
const { triageComplaint } = require("../services/geminiService");

const router = express.Router();

router.post("/triage", async (req, res) => {
  try {
    const {
      description,
      category,
      location,
      ward,
    } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({
        message: "Complaint description is required",
      });
    }

    const result = await triageComplaint({
      description: description.trim(),
      category: category || "",
      location: location || "",
      ward: ward || "",
    });

    res.json({
      message: result.aiUsed
        ? "Gemini AI triage completed successfully"
        : "Fallback triage completed successfully",
      triage: result,
    });
  } catch (error) {
    console.error("AI triage route error:", error);

    res.status(500).json({
      message: "Unable to analyse the complaint",
      error: error.message,
    });
  }
});

module.exports = router;
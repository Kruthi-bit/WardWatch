const express = require("express");
const db = require("../db");
const router = express.Router();
const { triageComplaint } = require("../services/geminiService");

// Helper to extract numeric ID if sent with 'WW-' prefix
function parseComplaintId(idParam) {

  if (!idParam) return 0;
  const cleaned = idParam.toString().replace(/[^0-9]/g, "");
  return cleaned ? parseInt(cleaned, 10) : idParam;
}
function formatHistoryDate(value) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function getStatusDetails(status, department) {
  const details = {
    Submitted: {
      message: "Complaint registered successfully.",
      dotColor: "bg-green-500",
    },
    Assigned: {
      message: `Complaint assigned to ${department || "the concerned department"
        }.`,
      dotColor: "bg-blue-500",
    },
    "In Progress": {
      message: "The department has started working on the complaint.",
      dotColor: "bg-amber-500",
    },
    Resolved: {
      message: "The complaint has been resolved successfully.",
      dotColor: "bg-emerald-500",
    },
  };

  return (
    details[status] || {
      message: `Status updated to ${status}.`,
      dotColor: "bg-slate-500",
    }
  );
}
// 1. GET ALL COMPLAINTS (Supports filter by ward, status, category, or search)
// 1. GET ALL COMPLAINTS
router.get("/", (req, res) => {
  const { ward, status, category, search } = req.query;

  let sql = "SELECT * FROM complaints WHERE 1=1";
  const params = [];

  if (ward && ward !== "All" && ward !== "Select your ward") {
    sql += " AND ward = ?";
    params.push(ward);
  }

  if (status && status !== "All") {
    sql += " AND status = ?";
    params.push(status);
  }

  if (category && category !== "Select category") {
    sql += " AND category = ?";
    params.push(category);
  }

  if (search) {
    const numSearch = parseComplaintId(search);

    sql +=
      " AND (id = ? OR title LIKE ? OR location LIKE ? OR ward LIKE ?)";

    params.push(
      numSearch,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`
    );
  }

  sql += " ORDER BY id DESC";

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching complaints:", err);

      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    if (results.length === 0) {
      return res.json([]);
    }

    const complaintIds = results.map((row) => row.id);

    const historySql = `
      SELECT *
      FROM complaint_history
      WHERE complaint_id IN (?)
      ORDER BY created_at ASC, id ASC
    `;

    db.query(historySql, [complaintIds], (historyError, historyResults) => {
      if (historyError) {
        console.error("Error fetching complaint history:", historyError);

        return res.status(500).json({
          message: "History database error",
          error: historyError.message,
        });
      }

      const formatted = results.map((row) => {
        let timeline = historyResults
          .filter((history) => history.complaint_id === row.id)
          .map((history) => ({
            stage: history.stage,
            date: formatHistoryDate(history.created_at),
            message: history.message,
            dotColor: history.dot_color,
          }));

        // Fallback for complaints created before the history table
        if (timeline.length === 0) {
          timeline = [
            {
              stage: "Submitted",
              date: row.filed_date || formatHistoryDate(row.created_at),
              message: "Complaint registered successfully.",
              dotColor: "bg-green-500",
            },
          ];

          if (row.status && row.status !== "Submitted") {
            const statusDetails = getStatusDetails(
              row.status,
              row.department
            );

            timeline.push({
              stage: row.status,
              date: formatHistoryDate(row.updated_at || row.created_at),
              message: statusDetails.message,
              dotColor: statusDetails.dotColor,
            });
          }
        }

        return {
          id: `WW-${row.id}`,
          rawId: row.id,
          title: row.title || "Civic Issue",
          fullName: row.full_name || "Anonymous",
          mobileNumber: row.mobile_number || "",
          email: row.email || "",
          ward: row.ward || "Indiranagar",
          category: row.category || "Others",
          location: row.location || "",
          lat: row.latitude ? parseFloat(row.latitude) : 12.9784,
          lng: row.longitude ? parseFloat(row.longitude) : 77.6408,
          description: row.description || "",
          aiSummary: row.ai_summary || row.description || "",
          department:
            row.department || "General Municipal Department",
          status: row.status || "Submitted",
          priority: row.priority || "Medium",
          aiConfidence: row.ai_confidence || "92%",
          aiAssisted: true,
          imageUrl: row.image_url || null,
          upvotes: row.upvotes || 1,
          filedDate:
            row.filed_date ||
            new Date(row.created_at).toLocaleDateString("en-GB"),
          createdAt: row.created_at,
          timeline,
        };
      });

      res.json(formatted);
    });
  });
});
// FIND POSSIBLE DUPLICATE COMPLAINTS
router.get("/duplicates/check", (req, res) => {
  const { ward, category } = req.query;

  if (!ward || !category) {
    return res.status(400).json({
      message: "Ward and category are required",
    });
  }

  const sql = `
    SELECT id, title, location, ward, category, status, upvotes
    FROM complaints
    WHERE ward = ?
      AND category = ?
      AND status != 'Resolved'
    ORDER BY id DESC
    LIMIT 5
  `;

  db.query(sql, [ward, category], (err, results) => {
    if (err) {
      console.error("Duplicate check error:", err);

      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    const duplicates = results.map((complaint) => ({
      ...complaint,
      id: `WW-${complaint.id}`,
      rawId: complaint.id,
    }));

    res.json(duplicates);
  });
});

// 2. GET SINGLE COMPLAINT BY ID (Supports 42 or 'WW-42')
router.get("/:id", (req, res) => {
  const numericId = parseComplaintId(req.params.id);

  db.query("SELECT * FROM complaints WHERE id = ?", [numericId], (err, results) => {
    if (err) {
      console.error("Error fetching complaint:", err);
      return res.status(500).json({ message: "Database error" });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    const row = results[0];
    res.json({
      id: `WW-${row.id}`,
      rawId: row.id,
      title: row.title,
      fullName: row.full_name,
      mobileNumber: row.mobile_number,
      email: row.email,
      ward: row.ward,
      category: row.category,
      location: row.location,
      lat: row.latitude ? parseFloat(row.latitude) : 12.9784,
      lng: row.longitude ? parseFloat(row.longitude) : 77.6408,
      description: row.description,
      department: row.department,
      status: row.status,
      priority: row.priority,
      aiConfidence: row.ai_confidence,
      imageUrl: row.image_url,
      upvotes: row.upvotes,
      filedDate: row.filed_date,
      createdAt: row.created_at,
    });
  });
});

// 3. CREATE NEW COMPLAINT (ID is Auto-Incremented by MySQL)
// 3. CREATE NEW COMPLAINT
router.post("/", async (req, res) => {
  const {
    title,
    fullName,
    full_name,
    mobileNumber,
    mobile_number,
    email,
    ward,
    category,
    location,
    lat,
    latitude,
    lng,
    longitude,
    description,
    department,
    priority,
    status,
    aiConfidence,
    ai_confidence,
    imageUrl,
    image_url,
    filedDate,
    filed_date,
  } = req.body;

  const descText =
    description || title || "Civic complaint";

  const complaintTitle =
    title ||
    (descText.length > 45
      ? descText.slice(0, 45) + "..."
      : descText);

  const currentDate =
    filedDate ||
    filed_date ||
    new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const aiResult = await triageComplaint({
    description: descText,
    category,
    location,
    ward,
  });

  const finalTitle = aiResult.title || complaintTitle;
  const finalCategory = aiResult.category || category || "Others";
  const finalDepartment =
    aiResult.department ||
    department ||
    "General Municipal Department";
  const finalPriority =
    aiResult.priority || priority || "Medium";
  const finalAiConfidence =
    aiResult.confidence ||
    aiConfidence ||
    ai_confidence ||
    "Rule-based";
  const finalAiSummary =
    aiResult.summary ||
    "Complaint submitted for department review.";

  const sql = `
    INSERT INTO complaints
    (
      title,
      full_name,
      mobile_number,
      email,
      ward,
      category,
      location,
      latitude,
      longitude,
      description,
      department,
      status,
      priority,
      ai_confidence,
      ai_summary,
      image_url,
      filed_date
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    finalTitle,
    fullName || full_name || "Anonymous",
    mobileNumber || mobile_number || "",
    email || "",
    ward || "Indiranagar",
    finalCategory,
    location || "",
    lat || latitude || 12.9784,
    lng || longitude || 77.6408,
    descText,
    finalDepartment,
    status || "Submitted",
    finalPriority,
    finalAiConfidence,
    finalAiSummary,
    imageUrl || image_url || null,
    currentDate,
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error inserting complaint:", err);

      return res.status(500).json({
        message: "Database error",
        error: err.message,
      });
    }

    const newId = result.insertId;
    const ticketId = `WW-${newId}`;

    const historySql = `
      INSERT INTO complaint_history
      (complaint_id, stage, message, dot_color)
      VALUES (?, ?, ?, ?)
    `;

    const historyValues = [
      newId,
      "Submitted",
      "Complaint registered successfully.",
      "bg-green-500",
    ];

    db.query(
      historySql,
      historyValues,
      (historyError) => {
        if (historyError) {
          console.error(
            "Error saving initial complaint history:",
            historyError
          );

          return res.status(500).json({
            message:
              "Complaint registered, but Stage History could not be saved",
            error: historyError.message,
          });
        }

        res.status(201).json({
          message: "Complaint registered successfully",
          id: ticketId,
          rawId: newId,
          ticketId,
          title: finalTitle,
          category: finalCategory,
          location: location || "",
          ward: ward || "Indiranagar",
          status: status || "Submitted",
          department: finalDepartment,
          priority: finalPriority,
          aiConfidence: finalAiConfidence,
          aiSummary: finalAiSummary,
          aiSource: aiResult.source || "fallback",
        });
      }
    );
  });
});

// 4. UPDATE COMPLAINT STATUS / DEPARTMENT / PRIORITY
router.patch("/:id/status", (req, res) => {
  const numericId = parseComplaintId(req.params.id);
  const { status, department, priority } = req.body;

  if (!status && !department && !priority) {
    return res.status(400).json({
      message: "No fields to update provided",
    });
  }

  // Get the complaint's current information
  db.query(
    "SELECT * FROM complaints WHERE id = ?",
    [numericId],
    (findError, results) => {
      if (findError) {
        console.error("Error finding complaint:", findError);

        return res.status(500).json({
          message: "Database error",
          error: findError.message,
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          message: "Complaint not found",
        });
      }

      const existingComplaint = results[0];
      const updates = [];
      const params = [];

      if (status) {
        updates.push("status = ?");
        params.push(status);
      }

      if (department) {
        updates.push("department = ?");
        params.push(department);
      }

      if (priority) {
        updates.push("priority = ?");
        params.push(priority);
      }

      params.push(numericId);

      const updateSql = `
        UPDATE complaints
        SET ${updates.join(", ")}
        WHERE id = ?
      `;

      db.query(updateSql, params, (updateError) => {
        if (updateError) {
          console.error("Error updating complaint:", updateError);

          return res.status(500).json({
            message: "Database error",
            error: updateError.message,
          });
        }

        const statusChanged =
          status && status !== existingComplaint.status;

        const finalDepartment =
          department || existingComplaint.department;

        const finalStatus =
          status || existingComplaint.status;

        const finalPriority =
          priority || existingComplaint.priority;

        // Do not create duplicate history when status is unchanged
        if (!statusChanged) {
          return res.json({
            message: "Complaint updated successfully",
            id: `WW-${numericId}`,
            rawId: numericId,
            status: finalStatus,
            department: finalDepartment,
            priority: finalPriority,
          });
        }

        const statusDetails = getStatusDetails(
          finalStatus,
          finalDepartment
        );

        const historySql = `
          INSERT INTO complaint_history
          (complaint_id, stage, message, dot_color)
          VALUES (?, ?, ?, ?)
        `;

        const historyValues = [
          numericId,
          finalStatus,
          statusDetails.message,
          statusDetails.dotColor,
        ];

        db.query(
          historySql,
          historyValues,
          (historyError) => {
            if (historyError) {
              console.error(
                "Error saving complaint history:",
                historyError
              );

              return res.status(500).json({
                message:
                  "Complaint updated, but history could not be saved",
                error: historyError.message,
              });
            }

            res.json({
              message:
                "Complaint and Stage History updated successfully",
              id: `WW-${numericId}`,
              rawId: numericId,
              status: finalStatus,
              department: finalDepartment,
              priority: finalPriority,
            });
          }
        );
      });
    }
  );
});

// 5. UPVOTE A COMPLAINT
router.post("/:id/upvote", (req, res) => {
  const numericId = parseComplaintId(req.params.id);
  const sql = "UPDATE complaints SET upvotes = upvotes + 1 WHERE id = ?";

  db.query(sql, [numericId], (err, result) => {
    if (err) {
      console.error("Error upvoting complaint:", err);
      return res.status(500).json({ message: "Database error", error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    res.json({
      message: "Upvote registered successfully",
      id: `WW-${numericId}`,
    });
  });
});

module.exports = router;
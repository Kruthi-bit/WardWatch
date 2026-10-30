const express = require("express");
const db = require("../db");
const { triageComplaint } = require("../services/geminiService");

const router = express.Router();

/* -------------------------------------------------------
   HELPER FUNCTIONS
------------------------------------------------------- */

// Extracts the numeric ID from values such as WW-19
function parseComplaintId(idParam) {
  if (!idParam) {
    return 0;
  }

  const cleaned = String(idParam).replace(/[^0-9]/g, "");

  return cleaned ? parseInt(cleaned, 10) : 0;
}

// Converts AI-generated department names into standard names
function normalizeDepartment(department, category) {
  const value = `${department || ""} ${category || ""}`.toLowerCase();

  if (
    value.includes("road") ||
    value.includes("pothole") ||
    value.includes("street repair")
  ) {
    return "Road Maintenance Department";
  }

  if (
    value.includes("water") ||
    value.includes("leak") ||
    value.includes("pipeline")
  ) {
    return "Water Supply Department";
  }

  if (
    value.includes("drain") ||
    value.includes("sewage") ||
    value.includes("sewer")
  ) {
    return "Drainage Department";
  }

  if (
    value.includes("electric") ||
    value.includes("streetlight") ||
    value.includes("street light") ||
    value.includes("power")
  ) {
    return "Electrical Maintenance Department";
  }

  if (
    value.includes("garbage") ||
    value.includes("waste") ||
    value.includes("sanitation")
  ) {
    return "Solid Waste Management Department";
  }

  return "General Municipal Department";
}

function formatHistoryDate(value) {
  if (!value) {
    return "";
  }

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
      message: `Complaint assigned to ${
        department || "the concerned department"
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

/* -------------------------------------------------------
   1. GET ALL COMPLAINTS
------------------------------------------------------- */

router.get("/", (req, res) => {
  const { ward, status, category, search } = req.query;

  let sql = "SELECT * FROM complaints WHERE 1 = 1";
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
    const numericSearch = parseComplaintId(search);

    sql += `
      AND (
        id = ?
        OR title LIKE ?
        OR location LIKE ?
        OR ward LIKE ?
      )
    `;

    params.push(
      numericSearch,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`
    );
  }

  sql += " ORDER BY id DESC";

  db.query(sql, params, (error, results) => {
    if (error) {
      console.error("Error fetching complaints:", error);

      return res.status(500).json({
        message: "Database error",
        error: error.message,
      });
    }

    if (results.length === 0) {
      return res.json([]);
    }

    const complaintIds = results.map((complaint) => complaint.id);

    const historySql = `
      SELECT *
      FROM complaint_history
      WHERE complaint_id IN (?)
      ORDER BY created_at ASC, id ASC
    `;

    db.query(
      historySql,
      [complaintIds],
      (historyError, historyResults) => {
        if (historyError) {
          console.error(
            "Error fetching complaint history:",
            historyError
          );

          return res.status(500).json({
            message: "History database error",
            error: historyError.message,
          });
        }

        const formattedComplaints = results.map((row) => {
          const normalizedDepartment = normalizeDepartment(
            row.department,
            row.category
          );

          let timeline = historyResults
            .filter(
              (history) =>
                Number(history.complaint_id) === Number(row.id)
            )
            .map((history) => ({
              stage: history.stage,
              date: formatHistoryDate(history.created_at),
              message: history.message,
              dotColor: history.dot_color,
            }));

          // Fallback for older complaints without history
          if (timeline.length === 0) {
            timeline = [
              {
                stage: "Submitted",
                date:
                  row.filed_date ||
                  formatHistoryDate(row.created_at),
                message: "Complaint registered successfully.",
                dotColor: "bg-green-500",
              },
            ];

            if (row.status && row.status !== "Submitted") {
              const statusDetails = getStatusDetails(
                row.status,
                normalizedDepartment
              );

              timeline.push({
                stage: row.status,
                date: formatHistoryDate(
                  row.updated_at || row.created_at
                ),
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
            lat: row.latitude
              ? parseFloat(row.latitude)
              : 12.9784,
            lng: row.longitude
              ? parseFloat(row.longitude)
              : 77.6408,
            description: row.description || "",
            aiSummary:
              row.ai_summary || row.description || "",
            department: normalizedDepartment,
            status: row.status || "Submitted",
            priority: row.priority || "Medium",
            aiConfidence: row.ai_confidence || "Rule-based",
            aiAssisted: true,
            imageUrl: row.image_url || null,
            upvotes: row.upvotes || 0,
            filedDate:
              row.filed_date ||
              new Date(row.created_at).toLocaleDateString(
                "en-GB"
              ),
            createdAt: row.created_at,
            timeline,
          };
        });

        return res.json(formattedComplaints);
      }
    );
  });
});

/* -------------------------------------------------------
   2. FIND POSSIBLE DUPLICATE COMPLAINTS
------------------------------------------------------- */

router.get("/duplicates/check", (req, res) => {
  const { ward, category } = req.query;

  if (!ward || !category) {
    return res.status(400).json({
      message: "Ward and category are required",
    });
  }

  const sql = `
    SELECT
      id,
      title,
      location,
      ward,
      category,
      status,
      upvotes
    FROM complaints
    WHERE ward = ?
      AND category = ?
      AND status != 'Resolved'
    ORDER BY id DESC
    LIMIT 5
  `;

  db.query(sql, [ward, category], (error, results) => {
    if (error) {
      console.error("Duplicate check error:", error);

      return res.status(500).json({
        message: "Database error",
        error: error.message,
      });
    }

    const duplicates = results.map((complaint) => ({
      ...complaint,
      id: `WW-${complaint.id}`,
      rawId: complaint.id,
    }));

    return res.json(duplicates);
  });
});

/* -------------------------------------------------------
   3. GET A SINGLE COMPLAINT
------------------------------------------------------- */

router.get("/:id", (req, res) => {
  const numericId = parseComplaintId(req.params.id);

  if (!numericId) {
    return res.status(400).json({
      message: "Invalid complaint ID",
    });
  }

  const complaintSql =
    "SELECT * FROM complaints WHERE id = ?";

  db.query(
    complaintSql,
    [numericId],
    (error, results) => {
      if (error) {
        console.error("Error fetching complaint:", error);

        return res.status(500).json({
          message: "Database error",
          error: error.message,
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          message: "Complaint not found",
        });
      }

      const row = results[0];

      const normalizedDepartment = normalizeDepartment(
        row.department,
        row.category
      );

      const historySql = `
        SELECT *
        FROM complaint_history
        WHERE complaint_id = ?
        ORDER BY created_at ASC, id ASC
      `;

      db.query(
        historySql,
        [numericId],
        (historyError, historyResults) => {
          if (historyError) {
            console.error(
              "Error fetching complaint history:",
              historyError
            );

            return res.status(500).json({
              message: "History database error",
              error: historyError.message,
            });
          }

          let timeline = historyResults.map((history) => ({
            stage: history.stage,
            date: formatHistoryDate(history.created_at),
            message: history.message,
            dotColor: history.dot_color,
          }));

          if (timeline.length === 0) {
            timeline = [
              {
                stage: "Submitted",
                date:
                  row.filed_date ||
                  formatHistoryDate(row.created_at),
                message: "Complaint registered successfully.",
                dotColor: "bg-green-500",
              },
            ];
          }

          return res.json({
            id: `WW-${row.id}`,
            rawId: row.id,
            title: row.title || "Civic Issue",
            fullName: row.full_name || "Anonymous",
            mobileNumber: row.mobile_number || "",
            email: row.email || "",
            ward: row.ward || "",
            category: row.category || "Others",
            location: row.location || "",
            lat: row.latitude
              ? parseFloat(row.latitude)
              : 12.9784,
            lng: row.longitude
              ? parseFloat(row.longitude)
              : 77.6408,
            description: row.description || "",
            aiSummary:
              row.ai_summary || row.description || "",
            department: normalizedDepartment,
            status: row.status || "Submitted",
            priority: row.priority || "Medium",
            aiConfidence: row.ai_confidence || "Rule-based",
            aiAssisted: true,
            imageUrl: row.image_url || null,
            upvotes: row.upvotes || 0,
            filedDate:
              row.filed_date ||
              new Date(row.created_at).toLocaleDateString(
                "en-GB"
              ),
            createdAt: row.created_at,
            timeline,
          });
        }
      );
    }
  );
});

/* -------------------------------------------------------
   4. CREATE A NEW COMPLAINT
------------------------------------------------------- */

router.post("/", async (req, res) => {
  try {
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

    const descriptionText =
      description || title || "Civic complaint";

    const complaintTitle =
      title ||
      (descriptionText.length > 45
        ? `${descriptionText.slice(0, 45)}...`
        : descriptionText);

    const currentDate =
      filedDate ||
      filed_date ||
      new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

    const aiResult = await triageComplaint({
      description: descriptionText,
      category,
      location,
      ward,
    });

    const finalTitle =
      aiResult.title || complaintTitle;

    const finalCategory =
      aiResult.category || category || "Others";

    const finalDepartment = normalizeDepartment(
      aiResult.department || department,
      finalCategory
    );

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
      lat ?? latitude ?? 12.9784,
      lng ?? longitude ?? 77.6408,
      descriptionText,
      finalDepartment,
      status || "Submitted",
      finalPriority,
      finalAiConfidence,
      finalAiSummary,
      imageUrl || image_url || null,
      currentDate,
    ];

    db.query(sql, values, (error, result) => {
      if (error) {
        console.error(
          "Error inserting complaint:",
          error
        );

        return res.status(500).json({
          message: "Database error",
          error: error.message,
        });
      }

      const newId = result.insertId;
      const ticketId = `WW-${newId}`;

      const historySql = `
        INSERT INTO complaint_history
        (
          complaint_id,
          stage,
          message,
          dot_color
        )
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

          return res.status(201).json({
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
            aiSource: aiResult.aiUsed
              ? "gemini"
              : "fallback",
          });
        }
      );
    });
  } catch (error) {
    console.error("Complaint creation error:", error);

    return res.status(500).json({
      message: "Unable to register complaint",
      error: error.message,
    });
  }
});

/* -------------------------------------------------------
   5. UPDATE STATUS, DEPARTMENT OR PRIORITY
------------------------------------------------------- */

router.patch("/:id/status", (req, res) => {
  const numericId = parseComplaintId(req.params.id);

  let { status, department, priority } = req.body;

  if (!numericId) {
    return res.status(400).json({
      message: "Invalid complaint ID",
    });
  }

  if (!status && !department && !priority) {
    return res.status(400).json({
      message: "No fields to update provided",
    });
  }

  db.query(
    "SELECT * FROM complaints WHERE id = ?",
    [numericId],
    (findError, results) => {
      if (findError) {
        console.error(
          "Error finding complaint:",
          findError
        );

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

      if (department) {
        department = normalizeDepartment(
          department,
          existingComplaint.category
        );
      }

      const updates = [];
      const parameters = [];

      if (status) {
        updates.push("status = ?");
        parameters.push(status);
      }

      if (department) {
        updates.push("department = ?");
        parameters.push(department);
      }

      if (priority) {
        updates.push("priority = ?");
        parameters.push(priority);
      }

      parameters.push(numericId);

      const updateSql = `
        UPDATE complaints
        SET ${updates.join(", ")}
        WHERE id = ?
      `;

      db.query(
        updateSql,
        parameters,
        (updateError) => {
          if (updateError) {
            console.error(
              "Error updating complaint:",
              updateError
            );

            return res.status(500).json({
              message: "Database error",
              error: updateError.message,
            });
          }

          const statusChanged =
            status &&
            status !== existingComplaint.status;

          const finalDepartment =
            department ||
            normalizeDepartment(
              existingComplaint.department,
              existingComplaint.category
            );

          const finalStatus =
            status || existingComplaint.status;

          const finalPriority =
            priority || existingComplaint.priority;

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
            (
              complaint_id,
              stage,
              message,
              dot_color
            )
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

              return res.json({
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
        }
      );
    }
  );
});

/* -------------------------------------------------------
   6. UPVOTE A COMPLAINT
------------------------------------------------------- */

router.post("/:id/upvote", (req, res) => {
  const numericId = parseComplaintId(req.params.id);

  if (!numericId) {
    return res.status(400).json({
      message: "Invalid complaint ID",
    });
  }

  const sql = `
    UPDATE complaints
    SET upvotes = COALESCE(upvotes, 0) + 1
    WHERE id = ?
  `;

  db.query(sql, [numericId], (error, result) => {
    if (error) {
      console.error("Error upvoting complaint:", error);

      return res.status(500).json({
        message: "Database error",
        error: error.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Complaint not found",
      });
    }

    return res.json({
      message: "Upvote registered successfully",
      id: `WW-${numericId}`,
      rawId: numericId,
    });
  });
});

module.exports = router;
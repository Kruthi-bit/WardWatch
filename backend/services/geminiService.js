require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const allowedCategories = [
    "Pothole",
    "Garbage",
    "Water Leakage",
    "Street Light",
    "Drainage",
    "Road Damage",
    "Others",
];

const allowedPriorities = [
    "Low",
    "Medium",
    "High",
    "Critical",
];

// Used when Gemini is unavailable or the free limit is reached
function getFallbackTriage(description = "", selectedCategory = "") {
    const text = description.toLowerCase();

    let category = allowedCategories.includes(selectedCategory)
        ? selectedCategory
        : "Others";

    if (text.includes("pothole")) {
        category = "Pothole";
    } else if (
        text.includes("garbage") ||
        text.includes("waste")
    ) {
        category = "Garbage";
    } else if (
        text.includes("water") ||
        text.includes("leak")
    ) {
        category = "Water Leakage";
    } else if (
        text.includes("streetlight") ||
        text.includes("street light")
    ) {
        category = "Street Light";
    } else if (
        text.includes("drain") ||
        text.includes("sewage")
    ) {
        category = "Drainage";
    } else if (
        text.includes("road") ||
        text.includes("damaged road")
    ) {
        category = "Road Damage";
    }

    const departmentMap = {
        Pothole: "Road Maintenance Department",
        Garbage: "Solid Waste Management Department",
        "Water Leakage": "Water Supply Department",
        "Street Light": "Electrical Department",
        Drainage: "Drainage and Sewerage Department",
        "Road Damage": "Road Maintenance Department",
        Others: "General Municipal Department",
    };

    let priority = "Medium";

    if (
        text.includes("danger") ||
        text.includes("accident") ||
        text.includes("emergency") ||
        text.includes("severe")
    ) {
        priority = "Critical";
    } else if (
        text.includes("urgent") ||
        text.includes("major") ||
        text.includes("blocked")
    ) {
        priority = "High";
    }

    const cleanedDescription =
        description.trim() || "Civic complaint";

    return {
        title:
            cleanedDescription.length > 45
                ? `${cleanedDescription.slice(0, 45)}...`
                : cleanedDescription,
        summary:
            cleanedDescription.length > 100
                ? `${cleanedDescription.slice(0, 100)}...`
                : cleanedDescription,
        category,
        department: departmentMap[category],
        priority,
        confidence: "Rule-based fallback",
        aiUsed: false,
    };
}

async function triageComplaint({
    description,
    category,
    location,
    ward,
}) {
    const fallbackResult = getFallbackTriage(
        description,
        category
    );

    if (!process.env.GEMINI_API_KEY) {
        console.warn(
            "Gemini API key is missing. Using fallback triage."
        );

        return fallbackResult;
    }

    try {
        const prompt = `
You are an AI triage assistant for WardWatch, a civic complaint portal.

Analyse this complaint:

Description: ${description}
Citizen-selected category: ${category || "Not selected"}
Location: ${location || "Not provided"}
Ward: ${ward || "Not provided"}

Return only valid JSON with exactly these fields:

{
  "title": "Short complaint title",
  "summary": "One-sentence administrative summary",
  "category": "One allowed category",
  "department": "Responsible municipal department",
  "priority": "Low, Medium, High, or Critical",
  "confidence": "Percentage such as 92%"
}

Allowed categories:
Pothole, Garbage, Water Leakage, Street Light,
Drainage, Road Damage, Others.

Department examples:
Road Maintenance Department,
Solid Waste Management Department,
Water Supply Department,
Electrical Department,
Drainage and Sewerage Department,
General Municipal Department.

Do not include markdown or explanations outside the JSON.
`;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.2,
            },
        });

        const result = JSON.parse(response.text);

        const finalCategory = allowedCategories.includes(
            result.category
        )
            ? result.category
            : fallbackResult.category;

        const finalPriority = allowedPriorities.includes(
            result.priority
        )
            ? result.priority
            : fallbackResult.priority;

        return {
            title: result.title || fallbackResult.title,
            summary: result.summary || fallbackResult.summary,
            category: finalCategory,
            department:
                result.department || fallbackResult.department,
            priority: finalPriority,
            confidence: result.confidence || "90%",
            aiUsed: true,
        };
    } catch (error) {
        console.error("Gemini triage failed:", error);

        if (error.cause) {
            console.error("Gemini error cause:", error.cause);
        }

        return fallbackResult;
    }
}

module.exports = {
    triageComplaint,
};
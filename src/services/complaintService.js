// LocalStorage key for persisting complaints
const STORAGE_KEY = "wardwatch_complaints_v1";

// Initial mock complaints if storage is empty
const INITIAL_COMPLAINTS = [
  {
    id: "WW-40217",
    title: "Pothole near Indiranagar bus stop",
    fullName: "Ramesh Kumar",
    mobileNumber: "9876543210",
    email: "ramesh@example.com",
    ward: "Indiranagar",
    category: "Pothole",
    location: "12th Main, Indiranagar",
    lat: 12.9784,
    lng: 77.6408,
    description: "Large pothole near the bus stop causing traffic congestion and increasing the risk of accidents.",
    department: "Road Maintenance Department",
    status: "In Progress",
    priority: "High",
    filedDate: "14 Jul 2026",
    aiAssisted: true,
    aiConfidence: "94%",
    imageUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80",
    timeline: [
      {
        stage: "Submitted",
        date: "14 Jul 2026 • 09:20 AM",
        message: "Complaint registered successfully. AI Triage flagged as High Priority.",
        dotColor: "bg-green-500",
      },
      {
        stage: "Assigned",
        date: "15 Jul 2026 • 11:40 AM",
        message: "Assigned to the Road Maintenance Department.",
        dotColor: "bg-blue-500",
      },
      {
        stage: "In Progress",
        date: "17 Jul 2026 • 08:15 AM",
        message: "Repair crew dispatched to location.",
        dotColor: "bg-amber-500",
      },
    ],
    upvotes: 14,
  },
  {
    id: "WW-40198",
    title: "Garbage pile not collected",
    fullName: "Priya Sharma",
    mobileNumber: "9812345678",
    email: "priya@example.com",
    ward: "BTM Layout",
    category: "Garbage",
    location: "BTM Layout 2nd Stage",
    lat: 12.9166,
    lng: 77.6101,
    description: "Garbage was not collected for three days and was causing an unpleasant smell in the area.",
    department: "Solid Waste Management Department",
    status: "Resolved",
    priority: "Medium",
    filedDate: "10 Jul 2026",
    aiAssisted: true,
    aiConfidence: "98%",
    imageUrl: null,
    timeline: [
      {
        stage: "Submitted",
        date: "10 Jul 2026 • 10:30 AM",
        message: "Complaint registered successfully.",
        dotColor: "bg-green-500",
      },
      {
        stage: "Assigned",
        date: "10 Jul 2026 • 02:15 PM",
        message: "Assigned to the Solid Waste Management Department.",
        dotColor: "bg-blue-500",
      },
      {
        stage: "In Progress",
        date: "11 Jul 2026 • 08:40 AM",
        message: "Sanitation vehicle dispatched.",
        dotColor: "bg-amber-500",
      },
      {
        stage: "Resolved",
        date: "11 Jul 2026 • 01:20 PM",
        message: "Garbage cleared and street sanitized.",
        dotColor: "bg-emerald-500",
      },
    ],
    upvotes: 8,
  },
  {
    id: "WW-40233",
    title: "Continuous water pipe leak",
    fullName: "Anand Verma",
    mobileNumber: "9711223344",
    email: "anand@example.com",
    ward: "Jayanagar",
    category: "Water Leakage",
    location: "Jayanagar 4th Block",
    lat: 12.9308,
    lng: 77.5838,
    description: "Continuous water leakage near roadside pipe connection causing water wastage and slippery road.",
    department: "Water Supply Department",
    status: "Submitted",
    priority: "Critical",
    filedDate: "18 Jul 2026",
    aiAssisted: true,
    aiConfidence: "91%",
    imageUrl: null,
    timeline: [
      {
        stage: "Submitted",
        date: "18 Jul 2026 • 07:45 AM",
        message: "Complaint registered successfully.",
        dotColor: "bg-green-500",
      },
    ],
    upvotes: 23,
  },
  {
    id: "WW-40201",
    title: "Streetlight not working",
    fullName: "Sunita Patel",
    mobileNumber: "9654321098",
    email: "sunita@example.com",
    ward: "HSR Layout",
    category: "Street Light",
    location: "HSR Layout Sector 2",
    lat: 12.9121,
    lng: 77.6446,
    description: "The streetlight has not been working for the past week, making the dark junction unsafe at night.",
    department: "Electrical Maintenance Department",
    status: "Assigned",
    priority: "Low",
    filedDate: "12 Jul 2026",
    aiAssisted: true,
    aiConfidence: "89%",
    imageUrl: null,
    timeline: [
      {
        stage: "Submitted",
        date: "12 Jul 2026 • 06:10 PM",
        message: "Complaint registered successfully.",
        dotColor: "bg-green-500",
      },
      {
        stage: "Assigned",
        date: "13 Jul 2026 • 09:35 AM",
        message: "Assigned to the Electrical Maintenance Department.",
        dotColor: "bg-purple-500",
      },
    ],
    upvotes: 5,
  },
];

const API_BASE_URL = "http://localhost:5000/api/complaints";
function normalizeTicketId(value) {
  const id = String(value ?? "").trim();

  // Removes all existing WW- prefixes
  const numberPart = id.replace(/^(WW-)+/i, "");

  return `WW-${numberPart}`;
}

// Helper: Get all complaints (fetches from MySQL backend, fallback to LocalStorage)
export async function fetchComplaints() {
  try {
    const response = await fetch(API_BASE_URL, { signal: AbortSignal.timeout(3000) });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    }
  } catch (err) {
    console.log("Backend offline, using local data fallback.");
  }
  return getComplaints();
}

// Synchronous helper for instant local reading
export function getComplaints() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_COMPLAINTS));
    return INITIAL_COMPLAINTS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return INITIAL_COMPLAINTS;
  }
}

// Helper: Save a new complaint (Saves to MySQL Backend & LocalStorage)
export async function addComplaint(complaintData) {
  const complaints = getComplaints();

  // AI Triage Department & Priority Mapping
  const categoryDepartmentMap = {
    Pothole: "Road Maintenance Department",
    Garbage: "Solid Waste Management Department",
    "Water Leakage": "Water Supply Department",
    "Street Light": "Electrical Maintenance Department",
    Drainage: "Drainage & Sewerage Department",
    "Road Damage": "Road Maintenance Department",
    Others: "General Municipal Department",
  };

  const department = categoryDepartmentMap[complaintData.category] || "General Municipal Department";

  // Simulate AI Priority Prediction based on keywords
  let priority = "Medium";
  const desc = (complaintData.description || "").toLowerCase();
  if (desc.includes("danger") || desc.includes("accident") || desc.includes("flood") || desc.includes("burst") || desc.includes("urgent")) {
    priority = "Critical";
  } else if (desc.includes("large") || desc.includes("blocked") || desc.includes("heavy") || desc.includes("major")) {
    priority = "High";
  } else if (desc.includes("minor") || desc.includes("small") || desc.includes("bulb")) {
    priority = "Low";
  }

  const currentDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const aiConfidence = `${Math.floor(88 + Math.random() * 10)}%`;
  let ticketId = normalizeTicketId(
    Math.floor(10000 + Math.random() * 90000)
  );

  // Try saving directly to MySQL backend
  try {
    const payload = {
      title: complaintData.description.slice(0, 45) + (complaintData.description.length > 45 ? "..." : ""),
      fullName: complaintData.fullName,
      mobileNumber: complaintData.mobileNumber,
      email: complaintData.email,
      ward: complaintData.ward,
      category: complaintData.category,
      location: complaintData.location,
      lat: complaintData.lat || 12.9784,
      lng: complaintData.lng || 77.6408,
      description: complaintData.description,
      department: department,
      priority: priority,
      status: "Submitted",
      aiConfidence: aiConfidence,
      imageUrl: complaintData.imageUrl || null,
      filedDate: currentDate,
    };

    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3500),
    });

    if (response.ok) {
      const result = await response.json();

      const backendId =
        result.ticket_id ?? result.ticketId ?? result.id;

      if (backendId !== undefined && backendId !== null) {
        ticketId = normalizeTicketId(backendId);
      }
    }
  } catch (err) {
    console.log("MySQL backend unreachable, saved to local store.");
  }

  const newComplaint = {
    id: ticketId,
    title: complaintData.description.slice(0, 45) + (complaintData.description.length > 45 ? "..." : ""),
    fullName: complaintData.fullName,
    mobileNumber: complaintData.mobileNumber,
    email: complaintData.email,
    ward: complaintData.ward,
    category: complaintData.category,
    location: complaintData.location,
    lat: complaintData.lat || 12.9784,
    lng: complaintData.lng || 77.6408,
    description: complaintData.description,
    department: department,
    status: "Submitted",
    priority: priority,
    filedDate: currentDate,
    aiAssisted: true,
    aiConfidence: aiConfidence,
    imageUrl: complaintData.imageUrl || null,
    timeline: [
      {
        stage: "Submitted",
        date: `${currentDate} • ${currentTime}`,
        message: `Complaint registered. AI Triage automatically routed to ${department} with ${priority} Priority rating.`,
        dotColor: "bg-green-500",
      },
    ],
    upvotes: 1,
  };

  const updatedComplaints = [newComplaint, ...complaints];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedComplaints));
  return newComplaint;
}

// Helper: Update a complaint's status or department in MySQL & LocalStorage
export async function updateComplaint(id, updates) {
  const complaints = getComplaints();
  const index = complaints.findIndex((c) => c.id === id);

  const currentDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  // Call MySQL Backend PATCH
  try {
    await fetch(`${API_BASE_URL}/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
      signal: AbortSignal.timeout(3000),
    });
  } catch (err) {
    console.log("Backend offline, updating local state only.");
  }

  if (index === -1) return null;

  const complaint = complaints[index];

  // If status changed, push to timeline
  if (updates.status && updates.status !== complaint.status) {
    const dotColors = {
      Assigned: "bg-blue-500",
      "In Progress": "bg-amber-500",
      Resolved: "bg-emerald-500",
    };

    if (!complaint.timeline) complaint.timeline = [];
    complaint.timeline.push({
      stage: updates.status,
      date: `${currentDate} • ${currentTime}`,
      message: updates.timelineMessage || `Status updated to ${updates.status}.`,
      dotColor: dotColors[updates.status] || "bg-slate-500",
    });
    complaint.status = updates.status;
  }

  if (updates.department) {
    complaint.department = updates.department;
  }

  if (updates.priority) {
    complaint.priority = updates.priority;
  }

  complaints[index] = complaint;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
  return complaint;
}

// Helper: Upvote a complaint in MySQL & LocalStorage
export async function upvoteComplaint(id) {
  try {
    await fetch(`${API_BASE_URL}/${id}/upvote`, {
      method: "POST",
      signal: AbortSignal.timeout(3000),
    });
  } catch (err) {
    // fallback
  }

  const complaints = getComplaints();
  const index = complaints.findIndex((c) => c.id === id);
  if (index !== -1) {
    complaints[index].upvotes = (complaints[index].upvotes || 0) + 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
    return complaints[index].upvotes;
  }
  return 0;
}

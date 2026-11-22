# WardWatch – AI Smart Complaint & Civic Assistant

WardWatch is an AI-powered web application designed to help citizens report and track civic issues such as potholes, garbage accumulation, water leakage, damaged streetlights and drainage problems.

The system helps organize complaints and supports faster identification and prioritization of civic issues.

## Features

- **Civic Complaint Reporting:** Submit complaints with category, location, description and optional image.
- **AI-Based Complaint Classification:** Automatically identifies complaint categories.
- **Priority Detection:** Helps identify the urgency of complaints.
- **Duplicate Complaint Detection:** Identifies existing complaints and supports upvoting them.
- **Complaint Tracking:** Track complaint status using a complaint ID.
- **User Management:** User registration and login.
- **Staff/Admin Dashboard:** Manage complaints and update their status.
- **Database Integration:** Store and retrieve complaint information using MySQL.

## Technology Stack

| Frontend | Backend | Database | AI |
|---|---|---|---|
| React | Node.js | MySQL | Google Gemini API |
| Vite | Express.js | | |

Additional tools: JavaScript, HTML, CSS, Axios and Git/GitHub.

## Complaint Workflow

1. Citizen submits a civic complaint.
2. System processes the complaint and performs AI-based triage.
3. Duplicate complaints can be identified and upvoted.
4. Staff/admin manages the complaint.
5. Complaint status is updated until resolution.

**Complaint Status:** Submitted → Assigned → In Progress → Resolved

## Project Structure

```text
WardWatch/
├── backend/
│   ├── routes/
│   ├── services/
│   ├── server.js
│   ├── db.js
│   └── package.json
├── public/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── styles/
├── package.json
└── README.md
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/Kruthi-bit/WardWatch.git
cd WardWatch
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd backend
npm install
```

### 4. Configure environment variables

Create your local `.env` files using the provided `.env.example` templates.

Configure your MySQL database credentials and Gemini API key locally.

**Never upload real API keys or passwords to GitHub.**

### 5. Run the application

Start the backend:

```bash
cd backend
npm start
```

Start the frontend in another terminal from the project root:

```bash
npm run dev
```

Open the local URL displayed by Vite in your browser.

## Future Enhancements

- Improved civic issue visualization using maps.
- Enhanced AI-based image analysis.
- Advanced complaint analytics and reporting.
- Deployment for public access.

## Author

**Kruthi H S**

GitHub: https://github.com/Kruthi-bit

---

*WardWatch – Making civic grievance reporting smarter and more accessible.*

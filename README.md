# WardWatch

WardWatch is an AI-assisted civic grievance reporting and resolution system. It allows citizens to report civic issues, upload proof images, track complaints using ticket IDs, and monitor resolution progress.

The staff portal allows municipal staff to view complaints, assign departments, update complaint status, and monitor complaint statistics across departments and wards.

## Project Title

**AI Smart Complaint & Civic Assistant (WardWatch): An Intelligent Web-Based System for Civic Grievance Reporting and Resolution**

## Features

### Citizen Features

- Citizen registration and mobile-number login
- Civic complaint submission
- Location and ward selection
- Proof-photo upload
- Unique complaint ticket ID
- Complaint tracking using ticket ID
- Complaint status and stage-history display
- My Complaints dashboard
- Duplicate complaint detection
- Upvoting existing duplicate complaints

### AI Features

- AI-generated complaint title
- AI complaint summary
- AI category detection
- AI department assignment
- AI priority detection
- AI confidence information
- Rule-based fallback when AI is unavailable

### Staff Features

- Staff overview dashboard
- Complete complaint list
- Complaint details
- Department assignment
- Status updates
- Priority updates
- Department workload statistics
- Ward-level complaint statistics
- Complaint resolution monitoring

## Complaint Workflow

```text
Submitted → Assigned → In Progress → Resolved
```

Every status change is recorded and displayed in the complaint’s stage history.

## Technologies Used

### Frontend

- React
- Vite
- Tailwind CSS
- React Router DOM
- Lucide React
- JavaScript

### Backend

- Node.js
- Express.js
- MySQL
- Gemini API
- CORS
- dotenv

## Project Structure

```text
WardWatch/
├── backend/
│   ├── routes/
│   ├── services/
│   ├── database.sql
│   ├── db.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── styles/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── .gitignore
├── index.html
├── package.json
└── README.md
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
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

### 4. Create the MySQL database

Open MySQL Workbench and execute:

```text
backend/database.sql
```

This creates the following tables:

- `users`
- `complaints`
- `complaint_history`

### 5. Configure the backend environment

Inside the `backend` folder, create a file named:

```text
.env
```

Use `backend/.env.example` as the reference:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=wardwatch
GEMINI_API_KEY=your_gemini_api_key
```

Never upload your real `.env` file to GitHub.

### 6. Configure the frontend environment

Create a `.env` file in the main project folder:

```env
VITE_COMPLAINTS_API_URL=http://localhost:5000/api/complaints
```

## Running the Project

### Start the backend

Open a terminal inside the `backend` folder:

```bash
node server.js
```

The backend runs at:

```text
http://localhost:5000
```

### Start the frontend

Open another terminal inside the main project folder:

```bash
npm run dev
```

The frontend normally runs at:

```text
http://localhost:5173
```

## Main API Endpoints

### Complaints

```text
GET    /api/complaints
GET    /api/complaints/:id
POST   /api/complaints
PATCH  /api/complaints/:id/status
POST   /api/complaints/:id/upvote
GET    /api/complaints/duplicates/check
```

### Users

```text
POST   /api/users/register
POST   /api/users/login
```

## Complaint Departments

- Road Maintenance Department
- Water Supply Department
- Drainage Department
- Electrical Maintenance Department
- Solid Waste Management Department
- General Municipal Department

## Production Build

To create the optimized frontend build:

```bash
npm run build
```

The generated production files are stored in the `dist` folder.

## Security

The following files and folders are excluded from GitHub:

- `.env`
- `node_modules`
- `dist`
- Log files
- VS Code settings

Only `.env.example` files containing placeholder values are included.

## Future Enhancements

- OTP verification
- Email and SMS notifications
- Cloud-based image storage
- Interactive citywide complaint map
- Complaint reopening and escalation
- Citizen feedback and resolution ratings
- Role-based staff authentication
- Deployment to a cloud platform

## Author

**Kruthi H. S.**

Bachelor of Computer Applications  
Bengaluru City University

## Project Purpose

This project was developed as a BCA academic project to demonstrate full-stack web development, database management, REST API development, AI integration, and civic grievance workflow automation.
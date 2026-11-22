import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Complaint from "./pages/Complaint";
import MyComplaints from "./pages/MyComplaint";
import StaffPortal from "./pages/StaffPortal";

// Allows only logged-in citizens
function CitizenRoute({ children }) {
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "staff") {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

// Allows only logged-in staff
function StaffRoute({ children }) {
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "staff") {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Citizen-only routes */}
        <Route
          path="/complaint"
          element={
            <CitizenRoute>
              <Complaint />
            </CitizenRoute>
          }
        />

        <Route
          path="/mycomplaints"
          element={
            <CitizenRoute>
              <MyComplaints />
            </CitizenRoute>
          }
        />

        {/* Staff-only route */}
        <Route
          path="/admin"
          element={
            <StaffRoute>
              <StaffPortal />
            </StaffRoute>
          }
        />

        {/* Unknown URLs */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
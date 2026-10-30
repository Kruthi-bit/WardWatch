import { useEffect, useState } from "react";
import {
  LogOut,
  MapPin,
  Search,
  UserRound,
} from "lucide-react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

function Navbar() {
  const [navSearch, setNavSearch] = useState("");
  const [loggedInUser, setLoggedInUser] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Check login information whenever the page changes.
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      setLoggedInUser(null);
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      setLoggedInUser(user);
    } catch (error) {
      console.error("Invalid stored user:", error);
      localStorage.removeItem("user");
      setLoggedInUser(null);
    }
  }, [location.pathname]);

  function handleNavSearch(event) {
    event.preventDefault();

    const searchValue = navSearch.trim();

    if (searchValue) {
      navigate(
        `/mycomplaints?search=${encodeURIComponent(searchValue)}`
      );
    } else {
      navigate("/mycomplaints");
    }
  }

  function handleLogout() {
    localStorage.removeItem("user");
    setLoggedInUser(null);
    setNavSearch("");
    navigate("/login");
  }

  const userName =
    loggedInUser?.full_name ||
    loggedInUser?.fullName ||
    "Resident";

  const userWard = loggedInUser?.ward || "";
  const isStaff = loggedInUser?.role === "staff";

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-6 py-4">
        {/* Logo */}
        <Link to="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white transition group-hover:bg-indigo-700">
            <MapPin size={21} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 transition group-hover:text-indigo-600">
                WardWatch
              </h1>

              <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-600">
                AI
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Civic Grievance & Ward Resolution Portal
            </p>
          </div>
        </Link>

        {/* Ticket search */}
        <form
          onSubmit={handleNavSearch}
          className="flex w-64 items-center gap-2 rounded-lg border border-gray-200 bg-slate-50 px-3 py-2 transition focus-within:border-indigo-500 focus-within:bg-white"
        >
          <Search size={17} className="text-slate-400" />

          <input
            type="text"
            value={navSearch}
            onChange={(event) =>
              setNavSearch(event.target.value)
            }
            placeholder="Track Ticket ID"
            className="w-full bg-transparent text-sm text-slate-700 outline-none"
          />
        </form>

        {/* Navigation links */}
        {/* Navigation links */}
        <div className="flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link
            to="/"
            className={
              location.pathname === "/"
                ? "font-semibold text-indigo-600"
                : "hover:text-indigo-600"
            }
          >
            Home
          </Link>

          {/* Citizen-only links */}
          {!isStaff && (
            <>
              <Link
                to="/complaint"
                className={
                  location.pathname === "/complaint"
                    ? "font-semibold text-indigo-600"
                    : "hover:text-indigo-600"
                }
              >
                Report Issue
              </Link>

              <Link
                to="/mycomplaints"
                className={
                  location.pathname === "/mycomplaints"
                    ? "font-semibold text-indigo-600"
                    : "hover:text-indigo-600"
                }
              >
                My Complaints
              </Link>
            </>
          )}

          {/* Staff-only link */}
          {isStaff && (
            <Link
              to="/admin"
              className={
                location.pathname === "/admin"
                  ? "font-semibold text-indigo-600"
                  : "hover:text-indigo-600"
              }
            >
              Staff Portal
            </Link>
          )}
        </div>

        {/* Login or logged-in user */}
        {loggedInUser ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white">
                <UserRound size={17} />
              </div>

              <div className="max-w-32">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {userName}
                </p>

                {userWard && (
                  <p className="truncate text-xs text-slate-500">
                    {userWard}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <LogOut size={17} />
              Logout
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Select Ward / Login
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
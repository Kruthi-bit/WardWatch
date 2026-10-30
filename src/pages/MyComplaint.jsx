import { useState, useEffect } from "react";
import {
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import {
  CalendarDays,
  FileText,
  MapPin,
  Search,
  Sparkles,
  Ticket,
  Camera,
} from "lucide-react";
import { fetchComplaints } from "../services/complaintService";

function MyComplaints() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialSearch = searchParams.get("search") || "";

  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [searchText, setSearchText] = useState(initialSearch);
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    async function loadComplaints() {
      const allComplaints = await fetchComplaints();
      const query = searchParams.get("search");
      const storedUser = localStorage.getItem("user");

      let list = [];

      if (storedUser) {
        try {
          const loggedInUser = JSON.parse(storedUser);

          const userMobile = String(
            loggedInUser.mobile_number ||
            loggedInUser.mobileNumber ||
            ""
          ).replace(/\D/g, "");

          list = allComplaints.filter((complaint) => {
            const complaintMobile = String(
              complaint.mobileNumber ||
              complaint.mobile_number ||
              ""
            ).replace(/\D/g, "");

            return complaintMobile === userMobile;
          });
        } catch (error) {
          console.error("Invalid stored user:", error);
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }
      } else if (query) {
        // A guest can view only the complaint opened using its Ticket ID
        list = allComplaints.filter(
          (complaint) =>
            complaint.id.toLowerCase() === query.toLowerCase()
        );
      } else {
        navigate("/login");
        return;
      }

      setComplaints(list);

      if (query && list.length > 0) {
        setSearchText(query);

        const match = list.find(
          (complaint) =>
            complaint.id.toLowerCase() === query.toLowerCase() ||
            complaint.title
              .toLowerCase()
              .includes(query.toLowerCase())
        );

        setSelectedComplaint(match || list[0]);
      } else if (list.length > 0) {
        setSelectedComplaint(list[0]);
      } else {
        setSelectedComplaint(null);
      }
    }

    loadComplaints();
  }, [searchParams, navigate]);

  const filters = [
    "All",
    "Submitted",
    "Assigned",
    "In Progress",
    "Resolved",
  ];

  const filteredComplaints = complaints.filter((complaint) => {
    const searchValue = searchText.toLowerCase();

    const matchesSearch =
      complaint.id.toLowerCase().includes(searchValue) ||
      complaint.title.toLowerCase().includes(searchValue);

    const matchesFilter =
      activeFilter === "All" || complaint.status === activeFilter;

    return matchesSearch && matchesFilter;
  });

  function getStatusStyles(status) {
    const styles = {
      Submitted: "bg-blue-100 text-blue-700",
      Assigned: "bg-purple-100 text-purple-700",
      "In Progress": "bg-amber-100 text-amber-700",
      Resolved: "bg-green-100 text-green-700",
    };

    return styles[status] || "bg-slate-100 text-slate-700";
  }

  function getFilterCount(filter) {
    if (filter === "All") {
      return complaints.length;
    }

    return complaints.filter((complaint) => complaint.status === filter).length;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        {/* Page Heading */}
        <h1 className="text-3xl font-bold text-slate-900">
          My Complaints
        </h1>

        <p className="mt-2 text-slate-500">
          Track and manage all your submitted complaints.
        </p>

        {/* Search and Filters */}
        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-[380px]">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search by Ticket ID or complaint"
              className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-all duration-200 ${activeFilter === filter
                  ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                  : "border-slate-300 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-sm"
                  }`}
              >
                {filter}

                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs ${activeFilter === filter
                    ? "bg-indigo-500 text-white"
                    : "bg-slate-100 text-slate-600"
                    }`}
                >
                  {getFilterCount(filter)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Complaint List */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                Complaint List
              </h2>

              <span className="text-sm font-medium text-slate-500">
                {filteredComplaints.length} found
              </span>
            </div>

            <div className="space-y-3">
              {filteredComplaints.length > 0 ? (
                filteredComplaints.map((complaint) => {
                  const isSelected =
                    selectedComplaint.id === complaint.id;

                  return (
                    <button
                      key={complaint.id}
                      type="button"
                      onClick={() => setSelectedComplaint(complaint)}
                      className={`relative w-full cursor-pointer overflow-hidden rounded-xl p-3 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${isSelected
                        ? "border-2 border-indigo-500 bg-indigo-50 shadow-lg"
                        : "border border-slate-200 bg-white hover:border-indigo-300"
                        }`}
                    >
                      {isSelected && (
                        <span className="absolute bottom-0 left-0 top-0 w-1 bg-indigo-600"></span>
                      )}

                      <div
                        className={`flex items-start justify-between gap-4 ${isSelected ? "pl-2" : ""
                          }`}
                      >
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">
                            {complaint.id}
                          </h3>

                          <p className="mt-0 text-sm text-slate-600">
                            {complaint.title}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {complaint.location}
                          </p>
                        </div>

                        <span
                          className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusStyles(
                            complaint.status
                          )}`}
                        >
                          {complaint.status}
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center">
                  <FileText size={36} className="text-slate-400" />

                  <p className="mt-3 font-semibold text-slate-700">
                    No complaints found
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Try another Ticket ID or status filter.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Complaint Details */}
          <div className="lg:col-span-3 min-h-[440px] rounded-2xl border border-slate-200 bg-white p-8 shadow-md">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                Complaint Details
              </h2>

              {selectedComplaint?.aiAssisted && (
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                  <Sparkles size={14} />
                  AI-assisted filing
                </span>
              )}
            </div>

            <div className="mt-7 space-y-6">
              {/* Ticket ID */}
              <div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Ticket size={18} />
                  <span>Ticket ID</span>
                </div>

                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {selectedComplaint?.id}
                </h3>
              </div>

              {/* Status */}
              <div>
                <p className="text-sm text-slate-500">
                  Status
                </p>

                <span
                  className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusStyles(
                    selectedComplaint?.status
                  )}`}
                >
                  {selectedComplaint?.status}
                </span>
              </div>

              {/* Location */}
              <div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <MapPin size={18} />
                  <span>Location</span>
                </div>

                <p className="mt-2 font-medium text-slate-800">
                  {selectedComplaint?.location}
                </p>
              </div>

              {/* Department */}
              <div>
                <p className="text-sm text-slate-500">
                  Assigned Department
                </p>

                <p className="mt-2 font-medium text-slate-800">
                  {selectedComplaint?.department}
                </p>
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <FileText size={18} />
                  <span>Description</span>
                </div>

                <p className="mt-2 leading-6 text-slate-700">
                  {selectedComplaint?.description}
                </p>
              </div>
              {/* Complaint proof image */}
              {selectedComplaint?.imageUrl && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Camera size={18} />
                    <span>Proof Photo</span>
                  </div>

                  <img
                    src={selectedComplaint.imageUrl}
                    alt={`Proof for complaint ${selectedComplaint.id}`}
                    className="mt-3 max-h-80 w-full rounded-xl border border-slate-200 object-contain bg-slate-50"
                  />
                </div>
              )}

              {/* Stage History */}
              <div>
                <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <CalendarDays size={20} />
                  <span>Stage History</span>
                </div>

                <div className="mt-5">
                  {selectedComplaint?.timeline
                    ?.filter(
                      (item, index, timeline) =>
                        index ===
                        timeline.findIndex(
                          (historyItem) =>
                            historyItem.stage === item.stage
                        )
                    )
                    .map((item, index, filteredTimeline) => {
                      const isLast = index === filteredTimeline.length - 1;

                      return (
                        <div
                          key={`${selectedComplaint.id}-${item.stage}`}
                          className={`flex gap-4 ${isLast ? "" : "pb-6"}`}
                        >
                          <div className="flex flex-col items-center">
                            <span
                              className={`h-4 w-4 rounded-full shadow-sm ${item.dotColor}`}
                            ></span>

                            {!isLast && (
                              <span className="mt-1 h-full w-px bg-slate-300"></span>
                            )}
                          </div>

                          <div>
                            <p className="font-bold text-slate-900">
                              {item.stage}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              {item.date}
                            </p>

                            <p className="mt-1 text-sm leading-5 text-slate-600">
                              {item.message}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              <p className="border-t border-slate-200 pt-4 text-xs text-slate-500">
                Filed on {selectedComplaint?.filedDate}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyComplaints;
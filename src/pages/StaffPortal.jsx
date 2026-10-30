import { useState, useEffect } from "react";
import {
  Building2,
  LayoutDashboard,
  MapPinned,
  ClipboardList,
  Construction,
  Droplets,
  Lightbulb,
  Trash2,
} from "lucide-react";
import { fetchComplaints, updateComplaint } from "../services/complaintService";

function StaffPortal() {
  const defaultDepartments = [
    {
      name: "Road Maintenance Department",
      icon: Construction,
    },
    {
      name: "Water Supply Department",
      icon: Droplets,
    },
    {
      name: "Drainage Department",
      icon: Droplets,
    },
    {
      name: "Electrical Maintenance Department",
      icon: Lightbulb,
    },
    {
      name: "Solid Waste Management Department",
      icon: Trash2,
    },
    {
      name: "General Municipal Department",
      icon: Building2,
    },
  ];

  const [departments, setDepartments] = useState(() => {
    try {
      const savedNames = JSON.parse(
        localStorage.getItem("wardwatch_departments") || "[]"
      );

      if (!Array.isArray(savedNames) || savedNames.length === 0) {
        return defaultDepartments;
      }

      const customDepartments = savedNames
        .filter(
          (name) =>
            !defaultDepartments.some(
              (department) => department.name === name
            )
        )
        .map((name) => ({
          name,
          icon: Building2,
        }));

      return [...defaultDepartments, ...customDepartments];
    } catch (error) {
      console.error("Unable to load departments:", error);
      return defaultDepartments;
    }
  });
  useEffect(() => {
    const departmentNames = departments.map(
      (department) => department.name
    );

    localStorage.setItem(
      "wardwatch_departments",
      JSON.stringify(departmentNames)
    );
  }, [departments]);
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [complaintsList, setComplaintsList] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [activeMenu, setActiveMenu] = useState("overview");
  const [showDepartmentForm, setShowDepartmentForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    async function loadData() {
      const list = await fetchComplaints();
      if (list && list.length > 0) {
        setComplaintsList(list);
        setSelectedComplaint(list[0]);
      }
    }
    loadData();
  }, []);

  const filteredComplaints = complaintsList.filter((c) => {
    if (statusFilter === "All") return true;
    return c.status === statusFilter;
  });

  const handleDepartmentChange = async (dept) => {
    if (!selectedComplaint) return;
    const newStatus = selectedComplaint.status === "Submitted" ? "Assigned" : selectedComplaint.status;
    await updateComplaint(selectedComplaint.id, { department: dept, status: newStatus });
    const updated = complaintsList.map((c) =>
      c.id === selectedComplaint.id ? { ...c, department: dept, status: newStatus } : c
    );
    setComplaintsList(updated);
    setSelectedComplaint((prev) => ({ ...prev, department: dept, status: newStatus }));
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedComplaint) return;
    await updateComplaint(selectedComplaint.id, { status: newStatus });
    const updated = complaintsList.map((c) =>
      c.id === selectedComplaint.id ? { ...c, status: newStatus } : c
    );
    setComplaintsList(updated);
    setSelectedComplaint((prev) => ({ ...prev, status: newStatus }));
  };

  const openCount = complaintsList.filter((c) => c.status !== "Resolved").length;
  const highPriorityCount = complaintsList.filter((c) => c.priority === "High" && c.status !== "Resolved").length;
  const resolvedCount = complaintsList.filter((c) => c.status === "Resolved").length;
  const submittedCount = complaintsList.filter(
    (complaint) => complaint.status === "Submitted"
  ).length;

  const assignedCount = complaintsList.filter(
    (complaint) => complaint.status === "Assigned"
  ).length;

  const inProgressCount = complaintsList.filter(
    (complaint) => complaint.status === "In Progress"
  ).length;

  const departmentStats = departments.map((department) => {
    const departmentComplaints = complaintsList.filter(
      (complaint) => complaint.department === department.name
    );

    const assigned = departmentComplaints.length;

    const resolved = departmentComplaints.filter(
      (complaint) => complaint.status === "Resolved"
    ).length;

    return {
      ...department,
      assigned,
      resolved,
    };
  });
  const wardStats = Object.values(
    complaintsList.reduce((wardData, complaint) => {
      const wardName = complaint.ward?.trim() || "Ward Not Specified";

      if (!wardData[wardName]) {
        wardData[wardName] = {
          name: wardName,
          total: 0,
          resolved: 0,
        };
      }

      wardData[wardName].total += 1;

      if (complaint.status === "Resolved") {
        wardData[wardName].resolved += 1;
      }

      return wardData;
    }, {})
  ).map((ward) => {
    const pending = ward.total - ward.resolved;

    const rate =
      ward.total === 0
        ? 0
        : Math.round((ward.resolved / ward.total) * 100);

    let status = "Needs Attention";
    let statusClass =
      "bg-amber-50 text-amber-700 border-amber-200";

    if (rate >= 90) {
      status = "Top Performer";
      statusClass =
        "bg-indigo-50 text-indigo-700 border-indigo-200";
    } else if (rate >= 75) {
      status = "On Track";
      statusClass =
        "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    return {
      ...ward,
      pending,
      rate,
      number: "Municipal Ward",
      officer: "Ward Administration",
      status,
      statusClass,
    };
  });

  const overallWardResolutionRate =
    complaintsList.length === 0
      ? 0
      : Math.round(
        (resolvedCount / complaintsList.length) * 100
      );

  const wardsNeedingAttention = wardStats.filter(
    (ward) => ward.rate < 75
  ).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-200 bg-white px-4 py-6">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-xl font-bold text-slate-900">
              WardWatch
            </h1>

            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
              Staff Console
            </p>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            <button
              type="button"
              onClick={() => setActiveMenu("overview")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${activeMenu === "overview"
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-100"
                }`}
            >
              <LayoutDashboard size={18} />
              Overview
            </button>

            <button
              type="button"
              onClick={() => setActiveMenu("complaints")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${activeMenu === "complaints"
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-100"
                }`}
            >
              <ClipboardList size={18} />
              Complaints
            </button>

            <button
              type="button"
              onClick={() => setActiveMenu("departments")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${activeMenu === "departments"
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-100"
                }`}
            >
              <Building2 size={18} />
              Departments
            </button>

            <button
              type="button"
              onClick={() => setActiveMenu("wards")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${activeMenu === "wards"
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-100"
                }`}
            >
              <MapPinned size={18} />
              Wards
            </button>

           
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-8 py-8">
          {activeMenu === "overview" && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Staff Console
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                Staff Overview
              </h2>

              <p className="mt-2 text-slate-500">
                Monitor complaint activity,priorities,and resolution progress at a glance.
              </p>
              {/* Statistics Cards */}
              <div className="mt-8 grid grid-cols-4 gap-5">

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Open Complaints
                  </p>

                  <h2 className="mt-3 text-3xl font-bold text-slate-900">
                    {openCount}
                  </h2>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                    High Priority
                  </p>

                  <h2 className="mt-3 text-3xl font-bold text-slate-600">
                    {highPriorityCount}
                  </h2>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                    Avg. Resolution Time
                  </p>

                  <h2 className="mt-3 text-3xl font-bold text-slate-900">
                    3.4d
                  </h2>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
                    Resolved (7d)
                  </p>

                  <h2 className="mt-3 text-3xl font-bold text-green-900">
                    {resolvedCount}
                  </h2>
                </div>

              </div>
              {/* Filter Buttons */}
              <div className="mt-8 flex flex-wrap gap-3">
                {[
                  { label: "All", count: complaintsList.length },
                  { label: "Submitted", count: complaintsList.filter((c) => c.status === "Submitted").length },
                  { label: "Assigned", count: complaintsList.filter((c) => c.status === "Assigned").length },
                  { label: "In Progress", count: complaintsList.filter((c) => c.status === "In Progress").length },
                  { label: "Resolved", count: complaintsList.filter((c) => c.status === "Resolved").length },
                ].map((tab) => (
                  <button
                    key={tab.label}
                    onClick={() => setStatusFilter(tab.label)}
                    className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${statusFilter === tab.label
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                  >
                    {tab.label} {tab.count}
                  </button>
                ))}
              </div>

              {/* Main Content Grid (7 cols table + 5 cols details) */}
              <div className="mt-8 grid grid-cols-12 gap-6">

                {/* Complaint Table */}
                <div className="col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900">
                      Complaints
                    </h3>

                    <span className="text-sm text-slate-500">
                      {filteredComplaints.length} complaints
                    </span>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    {/* Table Header */}
                    <div className="grid grid-cols-[100px_1fr_110px_100px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      <span>Ticket</span>
                      <span>AI Summary</span>
                      <span>Priority</span>
                      <span>Status</span>
                    </div>

                    {/* Complaint Rows */}
                    {filteredComplaints.map((complaint) => {
                      const isSelected = selectedComplaint?.id === complaint.id;

                      return (
                        <button
                          key={complaint.id}
                          type="button"
                          onClick={() => setSelectedComplaint(complaint)}
                          className={`grid w-full grid-cols-[100px_1fr_110px_100px] items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 ${isSelected
                            ? "bg-indigo-50/80 font-medium"
                            : "bg-white hover:bg-slate-50"
                            }`}
                        >
                          {/* Ticket */}
                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              {complaint.id}
                            </p>

                            <p className="mt-0.5 text-[11px] text-slate-400">
                              {complaint.location}
                            </p>
                          </div>

                          {/* AI Summary */}
                          <p className="truncate text-xs text-slate-600 pr-2">
                            {complaint.aiSummary || complaint.title}
                          </p>

                          {/* Priority */}
                          <span
                            className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold ${complaint.priority === "High"
                              ? "bg-red-50 text-red-600 border border-red-100"
                              : complaint.priority === "Medium"
                                ? "bg-amber-50 text-amber-600 border border-amber-100"
                                : "bg-green-50 text-green-600 border border-green-100"
                              }`}
                          >
                            {complaint.priority} priority
                          </span>

                          {/* Status */}
                          <span
                            className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold ${complaint.status === "Submitted"
                              ? "bg-slate-100 text-slate-600"
                              : complaint.status === "Assigned"
                                ? "bg-blue-50 text-blue-600 border border-blue-100"
                                : complaint.status === "In Progress"
                                  ? "bg-amber-50 text-amber-600 border border-amber-100"
                                  : "bg-green-50 text-green-600 border border-green-100"
                              }`}
                          >
                            {complaint.status}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Complaint Details Panel */}
                <div className="col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-xl font-bold text-slate-900">
                    Complaint Details
                  </h3>

                  {selectedComplaint && (
                    <div className="mt-4">
                      {/* Ticket and Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Ticket
                          </p>

                          <h4 className="mt-1 text-xl font-bold text-slate-900">
                            {selectedComplaint.id}
                          </h4>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedComplaint.status === "Submitted"
                            ? "bg-slate-100 text-slate-600"
                            : selectedComplaint.status === "Assigned"
                              ? "bg-blue-50 text-blue-600"
                              : selectedComplaint.status === "In Progress"
                                ? "bg-amber-50 text-amber-600"
                                : "bg-green-50 text-green-600"
                            }`}
                        >
                          {selectedComplaint.status}
                        </span>
                      </div>

                      {/* AI Summary */}
                      <div className="mt-5">
                        <span className="inline-flex rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-bold text-purple-600">
                          AI Summary
                        </span>

                        <p className="mt-2 text-sm leading-relaxed text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          {selectedComplaint.aiSummary || selectedComplaint.description}
                        </p>
                      </div>

                      {/* AI Priority */}
                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          AI Suggested Priority
                        </p>

                        <span
                          className={`mt-1.5 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${selectedComplaint.priority === "High"
                            ? "bg-red-50 text-red-600 border border-red-100"
                            : selectedComplaint.priority === "Medium"
                              ? "bg-amber-50 text-amber-600 border border-amber-100"
                              : "bg-green-50 text-green-600 border border-green-100"
                            }`}
                        >
                          {selectedComplaint.priority} priority
                        </span>
                      </div>

                      {/* Location */}
                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Location
                        </p>

                        <p className="mt-1.5 text-sm font-semibold text-slate-800">
                          {selectedComplaint.location} · {selectedComplaint.ward}
                        </p>
                      </div>

                      {/* Department Dropdown */}
                      <div className="mt-5">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Assign Department
                        </label>

                        <select
                          value={selectedComplaint.department || ""}
                          onChange={(e) => handleDepartmentChange(e.target.value)}
                          className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                        >
                          <option value="">Select a department</option>
                          <option value="Road Maintenance Department">
                            Road Maintenance Department
                          </option>
                          <option value="Water Supply Department">
                            Water Supply Department
                          </option>
                          <option value="Drainage Department">
                            Drainage Department
                          </option>
                          <option value="Electrical Maintenance Department">
                            Electrical Maintenance Department
                          </option>
                          <option value="Solid Waste Management Department">
                            Solid Waste Management Department
                          </option>
                          <option value="General Municipal Department">
                            General Municipal Department
                          </option>
                        </select>
                      </div>

                      {/* Status Action Buttons */}
                      <div className="mt-5 pt-4 border-t border-slate-200">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                          Update Status
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => handleStatusChange("Assigned")}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold border ${selectedComplaint.status === "Assigned" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 hover:bg-slate-50"}`}
                          >
                            Assigned
                          </button>
                          <button
                            onClick={() => handleStatusChange("In Progress")}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold border ${selectedComplaint.status === "In Progress" ? "bg-amber-500 text-white border-amber-500" : "bg-white text-slate-700 hover:bg-slate-50"}`}
                          >
                            In Progress
                          </button>
                          <button
                            onClick={() => handleStatusChange("Resolved")}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold border ${selectedComplaint.status === "Resolved" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-700 hover:bg-slate-50"}`}
                          >
                            Resolved
                          </button>
                        </div>
                      </div>

                      {/* Bottom Actions */}
                      <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4 text-xs text-slate-400">
                        <span>Filed {selectedComplaint.filedDate}</span>
                        <span className="font-mono text-slate-500">{selectedComplaint.id}</span>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
          {activeMenu === "complaints" && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Staff Console
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                All Complaints
              </h2>

              <p className="mt-2 text-slate-500">
                View and manage all complaints submitted by citizens.
              </p>
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Total Complaints
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {complaintsList.length}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Submitted
                  </p>

                  <p className="mt-2 text-2xl font-bold text-amber-600">
                    {submittedCount}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Assigned
                  </p>
                  <p className="mt-2 text-2xl font-bold text-indigo-600">
                    {assignedCount}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    In Progress
                  </p>
                  <p className="mt-2 text-2xl font-bold text-blue-600">
                    {inProgressCount}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Resolved
                  </p>
                  <p className="mt-2 text-2xl font-bold text-green-600">
                    {resolvedCount}
                  </p>
                </div>
              </div>

              <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* Complaint List Header */}
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Complaint List
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      View and select a complaint to see its details.
                    </p>
                  </div>

                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                    {complaintsList.length} complaints
                  </span>
                </div>

                {/* Responsive Complaint Table */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] table-fixed text-left">
                    <thead className="bg-slate-50">
                      <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <th className="w-[130px] px-6 py-4">
                          Ticket ID
                        </th>

                        <th className="w-[280px] px-6 py-4">
                          Issue
                        </th>

                        <th className="px-6 py-4">
                          Location
                        </th>

                        <th className="w-[150px] px-6 py-4">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {complaintsList.map((complaint, index) => (
                        <tr
                          key={complaint.id}
                          onClick={() => setSelectedComplaint(complaint)}
                          className={`cursor-pointer transition hover:bg-indigo-50/60 ${selectedComplaint?.id === complaint.id
                            ? "bg-indigo-50"
                            : index % 2 === 0
                              ? "bg-white"
                              : "bg-slate-50/40"
                            }`}
                        >
                          {/* Ticket ID */}
                          <td className="px-6 py-5 align-top">
                            <span className="whitespace-nowrap font-bold text-indigo-700">
                              {complaint.id}
                            </span>
                          </td>

                          {/* Issue */}
                          <td className="px-6 py-5 align-top">
                            <p
                              className="overflow-hidden text-ellipsis font-medium leading-6 text-slate-800"
                              title={complaint.title}
                            >
                              {complaint.title || "Civic complaint"}
                            </p>
                          </td>

                          {/* Location */}
                          <td className="px-6 py-5 align-top">
                            <p
                              className="overflow-hidden text-ellipsis text-sm leading-6 text-slate-600"
                              title={complaint.location}
                            >
                              {complaint.location || "Location not provided"}
                            </p>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-5 align-top">
                            <span
                              className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${complaint.status === "Resolved"
                                ? "bg-green-100 text-green-700"
                                : complaint.status === "In Progress"
                                  ? "bg-blue-100 text-blue-700"
                                  : complaint.status === "Assigned"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                            >
                              {complaint.status || "Submitted"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Empty List Message */}
                {complaintsList.length === 0 && (
                  <div className="px-6 py-12 text-center">
                    <p className="text-sm font-medium text-slate-600">
                      No complaints found.
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Submitted complaints will appear here.
                    </p>
                  </div>
                )}
              </div>
              {selectedComplaint && (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Complaint Details
                      </p>

                      <h3 className="mt-2 text-xl font-bold text-slate-900">
                        {selectedComplaint.id}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedComplaint(null)}
                      className="text-xl text-slate-400 hover:text-slate-900"
                    >

                    </button>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-400">ISSUE</p>
                      <p className="mt-1 font-medium text-slate-800">
                        {selectedComplaint.title}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-400">STATUS</p>
                      <p className="mt-1 font-medium text-slate-800">
                        {selectedComplaint.status}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-400">LOCATION</p>
                      <p className="mt-1 text-slate-700">
                        {selectedComplaint.location}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-400">PRIORITY</p>
                      <p className="mt-1 text-slate-700">
                        {selectedComplaint.priority}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeMenu === "departments" && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Staff Console
              </p>

              <div className="mt-2 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">
                    Departments
                  </h2>

                  <p className="mt-2 text-slate-500">
                    Monitor complaint workload across municipal departments.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDepartmentForm(true)}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Add Department
                </button>
              </div>
              <div className="mt-8 grid grid-cols-4 gap-5">

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Departments
                  </p>

                  <h2 className="mt-3 text-3xl font-bold text-slate-900">
                    {departments.length}
                  </h2>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                    Active Complaints
                  </p>

                  <h2 className="mt-3 text-3xl font-bold text-slate-900">
                    {assignedCount + inProgressCount}
                  </h2>

                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
                    Resolved
                  </p>

                  <h2 className="mt-3 text-3xl font-bold text-slate-900">
                    {resolvedCount}
                  </h2>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-500">
                    Pending
                  </p>

                  <h2 className="mt-3 text-3xl font-bold text-slate-900">
                    {submittedCount}
                  </h2>
                </div>

              </div>
              <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
                {
                  departmentStats.map((department) => {
                    const progress =
                      department.assigned === 0
                        ? 0
                        : Math.round((department.resolved / department.assigned) * 100);
                    const Icon = department.icon;
                    return (
                      <div
                        key={department.name}
                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-xl">
                              <Icon className="h-6 w-6 text-indigo-600" />
                            </div>

                            <div>
                              <h3 className="font-bold text-slate-900">
                                {department.name}
                              </h3>

                              <p className="mt-1 text-sm text-slate-500">
                                Complaint workload
                              </p>
                            </div>
                          </div>

                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {department.assigned} assigned
                          </span>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-4">
                          <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase text-slate-400">
                              Resolved
                            </p>

                            <p className="mt-2 text-2xl font-bold text-slate-900">
                              {department.resolved}
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase text-slate-400">
                              Pending
                            </p>

                            <p className="mt-2 text-2xl font-bold text-slate-900">
                              {department.assigned - department.resolved}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5">
                          <div className="mb-2 flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-500">
                              Resolution progress
                            </span>

                            <span className="font-semibold text-slate-700">
                              {progress}%
                            </span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${progress >= 80
                                ? "bg-green-500"
                                : progress >= 60
                                  ? "bg-blue-500"
                                  : "bg-amber-500"
                                }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
          {activeMenu === "wards" && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Staff Console
              </p>

              <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">
                    Ward SLA & Resolution Monitor
                  </h2>

                  <p className="mt-1 text-slate-500">
                    Monitor civic grievance performance, SLA compliance, and officer workload across municipal wards.
                  </p>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Monitored Wards
                  </p>
                  <h3 className="mt-2 text-3xl font-bold text-slate-900">
                    {wardStats.length}
                  </h3>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Total Ward Complaints
                  </p>
                  <h3 className="mt-2 text-3xl font-bold text-slate-900">
                    {complaintsList.length}
                  </h3>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                    Overall Resolution Rate
                  </p>
                  <h3 className="mt-2 text-3xl font-bold text-emerald-600">
                    {overallWardResolutionRate}%
                  </h3>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-500">
                    SLA Attention Required
                  </p>
                  <h3 className="mt-2 text-3xl font-bold text-amber-600">
                    {wardsNeedingAttention}{" "}
                    {wardsNeedingAttention === 1 ? "Ward" : "Wards"}
                  </h3>
                </div>
              </div>

              {/* Ward Grid Cards */}
              <div className="mt-8">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">
                  Ward Performance Cards
                </h3>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  
                  {wardStats.map((ward) => (
                    <div
                      key={ward.name}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-slate-300"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono text-xs font-bold text-slate-400">
                            {ward.number}
                          </span>
                          <h4 className="text-lg font-bold text-slate-900">
                            {ward.name}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {ward.officer}
                          </p>
                        </div>

                        <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${ward.statusClass}`}>
                          {ward.status}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center text-xs">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Total</p>
                          <p className="text-sm font-bold text-slate-900">{ward.total}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Resolved</p>
                          <p className="text-sm font-bold text-emerald-600">{ward.resolved}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Pending</p>
                          <p className="text-sm font-bold text-amber-600">{ward.pending}</p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500 font-medium">SLA Resolution Rate</span>
                          <span className="font-bold text-slate-800">{ward.rate}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${ward.rate >= 90 ? "bg-indigo-600" : ward.rate >= 80 ? "bg-emerald-500" : "bg-amber-500"
                              }`}
                            style={{ width: `${ward.rate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>

      </div>
      {showDepartmentForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                Add Department
              </h2>

              <button
                type="button"
                onClick={() => setShowDepartmentForm(false)}
                className="text-xl text-slate-500 hover:text-slate-900"
              >
                ×
              </button>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Create a new municipal department.
            </p>

            <div className="mt-5">
              <label className="text-sm font-medium text-slate-700">
                Department Name
              </label>

              <input
                type="text"
                placeholder="e.g. Water Department"
                value={newDepartmentName}
                onChange={(e) => setNewDepartmentName(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDepartmentForm(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const departmentName = newDepartmentName.trim();

                  if (!departmentName) {
                    return;
                  }

                  const alreadyExists = departments.some(
                    (department) =>
                      department.name.toLowerCase() ===
                      departmentName.toLowerCase()
                  );

                  if (alreadyExists) {
                    alert("This department already exists.");
                    return;
                  }

                  setDepartments((currentDepartments) => [
                    ...currentDepartments,
                    {
                      name: departmentName,
                      icon: Building2,
                    },
                  ]);

                  setNewDepartmentName("");
                  setShowDepartmentForm(false);
                }}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Add Department
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffPortal;
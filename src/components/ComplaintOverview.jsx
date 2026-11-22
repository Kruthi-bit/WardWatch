import { useEffect, useState } from "react";
import { MapPin, Search, Sparkles, CheckCircle2, Clock, Building2, AlertCircle, X } from "lucide-react";

function ComplaintOverview() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [searchError, setSearchError] = useState("");

  const [complaints, setComplaints] = useState([])

  useEffect(() => {
    fetch("http://localhost:5000/api/complaints")
      .then((response) => response.json())
      .then((data) => {
        console.log("HOME COMPLAINT DATA:", data);
        const formattedComplaints = data.map((complaint) => ({
          ...complaint,
          id: String(complaint.id).startsWith("WW-")
            ? String(complaint.id)
            : `WW-${complaint.id}`,

          statusClass:
            complaint.status === "Resolved"
              ? "bg-green-50 text-green-600 border-green-200"
              : complaint.status === "In Progress"
                ? "bg-amber-50 text-amber-600 border-amber-200"
                : complaint.status === "Assigned"
                  ? "bg-blue-50 text-blue-600 border-blue-200"
                  : "bg-slate-100 text-slate-600 border-slate-200",

          timeline: [
            {
              stage: "Submitted",
              date: complaint.created_at
                ? new Date(complaint.created_at).toLocaleDateString()
                : "",
              desc: "Complaint registered successfully",
            },
          ],
        }));

        setComplaints(formattedComplaints);
      })
      .catch((error) => {
        console.error("Error fetching complaints:", error);
      });
  }, []);
  const handleTrackSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim().toUpperCase();
    if (!query) {
      setSearchError("Please enter a ticket ID.");
      return;
    }

    const found = complaints.find(
      (c) => c.id.toUpperCase() === query || c.id.toUpperCase().includes(query)
    );

    if (found) {
      setSelectedTicket(found);
      setSearchError("");
    } else {
      setSelectedTicket(null);
      setSearchError(`No ticket found matching "${searchQuery}". Try WW-40217.`);
    }
  };

  return (
    <section className="mx-auto grid max-w-6xl gap-8 px-6 py-12 lg:grid-cols-2">
      {/* Left Column: Track a complaint */}
      <div>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">
          Track a complaint
        </h2>

        <form onSubmit={handleTrackSubmit} className="flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
          <Search className="ml-3 text-slate-400" size={17} />

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchError("");
            }}
            placeholder="Enter ticket ID, e.g. WW-1"
            className="min-w-0 flex-1 px-3 py-2 text-sm text-slate-700 outline-none"
          />

          <button
            type="submit"
            className="rounded-md bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Track
          </button>
        </form>

        {searchError && (
          <p className="mt-2 text-xs font-medium text-red-500 flex items-center gap-1">
            <AlertCircle size={13} /> {searchError}
          </p>
        )}

        {!searchError && (
          <p className="mt-2 text-xs text-slate-400">
            Enter a Ticket ID from the recently filed complaints.
          </p>
        )}

        {/* Selected / Search Result Detailed View */}
        {selectedTicket && (
          <div className="mt-6 rounded-2xl border border-indigo-100 bg-white p-6 shadow-lg animate-in fade-in duration-200 relative">
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-100 transition"
              title="Close details"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-indigo-600">
                {selectedTicket.id}
              </span>
              {selectedTicket.aiAssisted && (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-600">
                  <Sparkles size={11} /> AI Routed
                </span>
              )}
            </div>

            <h3 className="mt-2 text-base font-bold text-slate-900">
              {selectedTicket.title}
            </h3>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin size={13} className="text-slate-400" />
                {selectedTicket.location}
              </span>
              <span className="flex items-center gap-1">
                <Building2 size={13} className="text-slate-400" />
                {selectedTicket.department}
              </span>
            </div>

            {/* Timeline Progress */}
            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Resolution Timeline
              </p>

              <div className="space-y-3">
                {selectedTicket.timeline.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <div className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-[10px]">
                      ✓
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between font-semibold text-slate-800">
                        <span>{step.stage}</span>
                        <span className="text-[11px] font-normal text-slate-400">{step.date}</span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Recently filed nearby */}
      <div>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">
          Recently filed nearby
        </h2>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {complaints.map((complaint) => (
            <div
              key={complaint.id}
              onClick={() => {
                setSelectedTicket(complaint);
                setSearchQuery(complaint.id);
                setSearchError("");
              }}
              className={`flex items-center justify-between border-b border-slate-100 px-4 py-4 last:border-b-0 cursor-pointer transition ${selectedTicket?.id === complaint.id
                ? "bg-indigo-50/50 border-l-4 border-l-indigo-600"
                : "hover:bg-slate-50"
                }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-full bg-indigo-50 p-2 text-indigo-600">
                  <MapPin size={16} />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                    {complaint.id}
                  </h3>

                  <p className="text-xs text-slate-500">
                    {complaint.location}
                  </p>
                </div>
              </div>

              <span
                className={`rounded-md px-3 py-1 text-xs font-medium border ${complaint.statusClass}`}
              >
                {complaint.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ComplaintOverview;
import { MapPin, CalendarDays, Sparkles, Building2 } from "lucide-react";

function ComplaintCard({ complaint, isSelected, onClick }) {
  if (!complaint) return null;

  const statusStyles = {
    Submitted: "bg-blue-50 text-blue-700 border-blue-200",
    Assigned: "bg-purple-50 text-purple-700 border-purple-200",
    "In Progress": "bg-amber-50 text-amber-700 border-amber-200",
    Resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
        isSelected
          ? "border-indigo-600 bg-indigo-50/40 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-500">
              {complaint.id}
            </span>
            {complaint.aiAssisted && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                <Sparkles size={10} /> AI Triage
              </span>
            )}
          </div>
          <h4 className="mt-1 text-sm font-semibold text-slate-900 group-hover:text-indigo-600">
            {complaint.title}
          </h4>
        </div>

        <span
          className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
            statusStyles[complaint.status] || "bg-slate-100 text-slate-700 border-slate-200"
          }`}
        >
          {complaint.status}
        </span>
      </div>

      <p className="mt-2 line-clamp-2 text-xs text-slate-500">
        {complaint.description}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <MapPin size={13} className="text-slate-400" />
          {complaint.location}
        </span>
        <span className="flex items-center gap-1">
          <CalendarDays size={13} className="text-slate-400" />
          {complaint.filedDate}
        </span>
      </div>
    </div>
  );
}

export default ComplaintCard;

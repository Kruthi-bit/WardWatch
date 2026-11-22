import { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

function Hero() {
  const [searchTicket, setSearchTicket] = useState("");
  const navigate = useNavigate();

  const handleTrack = (e) => {
    e.preventDefault();
    if (searchTicket.trim()) {
      navigate(`/mycomplaints?search=${encodeURIComponent(searchTicket.trim())}`);
    } else {
      navigate("/mycomplaints");
    }
  };

  return (
    <section className="bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-5xl text-center">

        {/* AI badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600">
          <Sparkles size={16} />
          AI-Driven Municipal Grievance Triage Engine
        </div>

        {/* Main heading */}
        <h1 className="mt-7 text-4xl font-bold leading-tight text-slate-900 md:text-6xl">
          Report civic issues in your ward.
          <span className="block text-indigo-600">
            Track resolution in real time.
          </span>
        </h1>

        {/* Description */}
        <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-slate-500 md:text-lg">
          WardWatch uses Google Gemini AI to auto-categorize complaints,
          detect duplicate tickets, predict priority levels, and route issues
          directly to the responsible ward department.
        </p>

        {/* Main actions */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 md:flex-row">

          <Link
            to="/complaint"
            className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 shadow-sm"
          >
            Report a Grievance Now →
          </Link>

          <form onSubmit={handleTrack} className="flex w-full max-w-sm items-center rounded-lg border border-slate-200 bg-white p-1 shadow-sm focus-within:border-indigo-500">
            <Search className="ml-3 text-slate-400" size={17} />

            <input
              type="text"
              value={searchTicket}
              onChange={(e) => setSearchTicket(e.target.value)}
              placeholder="Enter Ticket ID (e.g. WW-40217)"
              className="min-w-0 flex-1 px-3 py-2 text-sm text-slate-700 outline-none"
            />

            <button
              type="submit"
              className="rounded-md bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Track
            </button>
          </form>
        </div>

        {/* Statistics */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-2xl font-bold text-slate-900">1,204</h3>
            <p className="mt-1 text-sm text-slate-500">Total Complaints</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-2xl font-bold text-green-600">87%</h3>
            <p className="mt-1 text-sm text-slate-500">Resolution Rate</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-2xl font-bold text-red-500">6</h3>
            <p className="mt-1 text-sm text-slate-500">
              High Priority Queue
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-2xl font-bold text-amber-500">3.4h</h3>
            <p className="mt-1 text-sm text-slate-500">
              Avg Resolution Time
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}

export default Hero;
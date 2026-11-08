import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  Users,
  Settings,
  LogOut,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  Trophy,
  RefreshCw,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
} from "recharts";

const API_URL = "https://cecb.lk/backend/api/dashboard_stats.php";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

/* ---------- Small reusable pieces ---------- */

const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded-md bg-slate-200/80 ${className}`} />
);

const StatCard = ({
  icon: Icon,
  label,
  value,
  badge,
  tone,
  loading,
  valueClass = "text-3xl font-bold",
}) => {
  const tones = {
    blue: "bg-blue-50 text-blue-600 ring-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    violet: "bg-violet-50 text-violet-600 ring-violet-100",
    amber: "bg-amber-50 text-amber-600 ring-amber-100",
  };
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${tones[tone]}`}>
          <Icon size={22} />
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {badge}
        </span>
      </div>
      <div className="mt-5">
        {loading ? (
          <Skeleton className="h-9 w-20" />
        ) : (
          <p
            title={typeof value === "string" ? value : undefined}
            className={`tracking-tight text-slate-900 ${valueClass}`}
          >
            {value}
          </p>
        )}
        <p className="mt-1 text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
};

const ActionCard = ({ icon: Icon, title, desc, tone, onClick }) => {
  const tones = {
    blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white hover:border-blue-300",
    emerald: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white hover:border-emerald-300",
    violet: "bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white hover:border-violet-300",
  };
  const [iconTone, , , hoverBorder] = [
    tones[tone].split(" ").slice(0, 3).join(" "),
    null,
    null,
    tones[tone].split(" ").slice(3).join(" "),
  ];
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${hoverBorder}`}
    >
      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl transition-colors duration-200 ${iconTone}`}>
        <Icon size={26} />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="font-semibold text-slate-900">{title}</h4>
        <p className="mt-0.5 text-sm text-slate-500">{desc}</p>
      </div>
      <ArrowUpRight
        size={20}
        className="shrink-0 text-slate-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-slate-700"
      />
    </button>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { title } = payload[0].payload;
  const v = payload[0].value;
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="mt-0.5 text-sm font-medium text-emerald-600">
        {v} applicant{v !== 1 ? "s" : ""}
      </p>
    </div>
  );
};

/* ---------- Page ---------- */

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalApplicants, setTotalApplicants] = useState(0);
  const [jobData, setJobData] = useState([]);
  const [user, setUser] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("user_id");
    navigate("/login");
  };

  const loadStats = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Request failed");
        return res.json();
      })
      .then((data) => {
        setTotalJobs(data.total_jobs || 0);
        setTotalApplicants(data.total_applicants || 0);
        setJobData(data.jobs || []);
      })
      .catch((err) => {
        console.error(err);
        setError("We couldn't load the latest statistics.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let storedUser = null;
    try {
      storedUser = JSON.parse(localStorage.getItem("user"));
    } catch {
      storedUser = null;
    }

    if (!storedUser || storedUser.role !== "admin") {
      navigate("/login");
      return;
    }
    setUser(storedUser);
    loadStats();
  }, [navigate, loadStats]);

  const avgPerJob = totalJobs > 0 ? Math.round(totalApplicants / totalJobs) : 0;

  const topJob = useMemo(() => {
    if (!jobData.length) return null;
    return jobData.reduce((a, b) => (Number(b.applicants) > Number(a.applicants) ? b : a));
  }, [jobData]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-72 bg-gradient-to-b from-emerald-50 via-sky-50/60 to-transparent" />

      {/* Top navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <img
              src="https://www.cecberp.lk/tax_invoice/logo-01.png"
              alt="Logo"
              className="h-12 w-auto object-contain sm:h-14"
            />
            <div className="hidden border-l border-slate-300 pl-4 sm:block">
              <h1 className="text-lg font-bold leading-tight text-slate-900">Recruitment Portal</h1>
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-600">
                Admin Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-4 shadow-sm">
                <div className="relative">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white shadow">
                    {user.username?.charAt(0).toUpperCase()}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                  </span>
                </div>
                <div className="hidden leading-tight md:block">
                  <p className="text-sm font-semibold text-slate-800">{user.username}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-all duration-200 hover:border-red-600 hover:bg-red-600 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {loading && (
          <div className="h-0.5 w-full overflow-hidden bg-slate-100">
            <div className="h-full w-1/3 animate-pulse bg-gradient-to-r from-emerald-500 to-sky-500" />
          </div>
        )}
      </nav>

      {/* Main */}
      <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Calendar size={15} />
              {today}
            </p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {getGreeting()}, <span className="text-emerald-600">{user?.username}</span> 
            </h2>
            <p className="mt-1 text-slate-500">Here's what's happening with your recruitment today.</p>
          </div>

          <button
            onClick={loadStats}
            disabled={loading}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="flex items-center gap-2">
              <AlertCircle size={18} />
              {error}
            </span>
            <button onClick={loadStats} className="font-semibold underline-offset-2 hover:underline">
              Try again
            </button>
          </div>
        )}

        {/* KPI cards */}
        <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Briefcase}
            label="Active job postings"
            value={totalJobs}
            badge="Total"
            tone="blue"
            loading={loading}
          />
          <StatCard
            icon={Users}
            label="Total applicants"
            value={totalApplicants}
            badge="Total"
            tone="emerald"
            loading={loading}
          />
          <StatCard
            icon={TrendingUp}
            label="Applicants per job"
            value={avgPerJob}
            badge="Average"
            tone="violet"
            loading={loading}
          />
          <StatCard
            icon={Trophy}
            label={topJob ? `${topJob.applicants} applicants` : "Most popular job"}
            value={topJob?.title || "—"}
            badge="Top"
            tone="amber"
            loading={loading}
            valueClass="text-lg font-semibold leading-snug line-clamp-2"
          />
        </section>

        {/* Chart */}
        <section className="mb-8 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Applications overview</h3>
              <p className="text-sm text-slate-500">Number of applicants per job position</p>
            </div>
            {!!jobData.length && (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                {jobData.length} position{jobData.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {loading ? (
            <Skeleton className="h-[350px] w-full" />
          ) : jobData.length ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={jobData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="title"
                  angle={-15}
                  textAnchor="end"
                  height={80}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(16,185,129,0.08)" }} />
                <Bar
                  dataKey="applicants"
                  fill="url(#barGradient)"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={56}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 py-16">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                <BarChart3 className="text-slate-400" size={30} />
              </div>
              <p className="font-medium text-slate-600">No data available yet</p>
              <p className="text-sm text-slate-400">Job applicant statistics will appear here</p>
            </div>
          )}
        </section>

        {/* Quick actions */}
        <section>
          <h3 className="mb-4 text-lg font-bold text-slate-900">Quick actions</h3>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <ActionCard
              icon={Briefcase}
              title="Manage Jobs"
              desc="Create, edit, and manage all job postings"
              tone="blue"
              onClick={() => navigate("/manage-jobs")}
            />
            <ActionCard
              icon={Users}
              title="View Applicants"
              desc="Review applications and export data"
              tone="emerald"
              onClick={() => navigate("/applicants")}
            />
            <ActionCard
              icon={Settings}
              title="Admin Settings"
              desc="Manage accounts and system preferences"
              tone="violet"
              onClick={() => navigate("/admin-settings")}
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 sm:px-6 md:flex-row">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Recruitment Portal. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <a href="#" className="transition-colors hover:text-slate-900">Privacy Policy</a>
            <a href="#" className="transition-colors hover:text-slate-900">Terms of Service</a>
            <a href="#" className="transition-colors hover:text-slate-900">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
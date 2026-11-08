import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BriefcaseIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
  ClockIcon,
  AcademicCapIcon,
  SparklesIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";

const JobList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState(null);
  const [statusType, setStatusType] = useState(null);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Load user
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  // Status message
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get("status");
    const message = params.get("message");
    if (status && message) {
      setStatusType(status);
      setStatusMessage(decodeURIComponent(message));

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setStatusMessage(null);
        setStatusType(null);
      }, 5000);
    }
  }, [location]);

  // Fetch jobs
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axios.get("https://cecb.lk/backend/api/jobs.php");
        const today = new Date();
const now = new Date();
setJobs(
  res.data.jobs.filter(
    (job) =>
      now < getDeadline(job.closing_date) &&
      String(job.enabled) === "1"
  )
);
      } catch {
        setError("Failed to load jobs.");
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const handleLoginLogout = () => {
    if (user) {
      localStorage.removeItem("user");
      localStorage.removeItem("user_id");
      navigate("/login");
    } else {
      navigate("/login");
    }
  };

const getDaysRemaining = (closingDate) => {
  const diff = getDeadline(closingDate) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

  // Returns the moment the job actually closes: 12:00 AM the day AFTER closing_date
const getDeadline = (closingDate) => {
  const [y, m, d] = String(closingDate).slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d + 1, 0, 0, 0, 0); // next day 00:00 local time
};

const [now, setNow] = useState(new Date());

useEffect(() => {
  const t = setInterval(() => setNow(new Date()), 60000);
  return () => clearInterval(t);
}, []);

const visibleJobs = jobs.filter(
  (job) => now < getDeadline(job.closing_date) && String(job.enabled) === "1"
);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">

      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50 backdrop-blur-lg bg-white/95">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">

            {/* Logo & Brand */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-lg">
                  <BriefcaseIcon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">
                    Career Portal
                  </h1>
                  <p className="text-xs text-gray-500">Find Your Dream Job</p>
                </div>
              </div>
            </div>

            {/* User Section */}
            <div className="flex items-center gap-4">
              {user && (
                <div className="hidden md:flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold shadow-md">
                    {user.username[0].toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm text-gray-800">
                      {user.username}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
              )}

              <button
                onClick={handleLoginLogout}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg"
              >
                {user ? (
                  <>
                    <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Logout</span>
                  </>
                ) : (
                  <>
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Login</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            CECB Online Recruitment{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              Portal
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore our latest job openings and take the next step in your career journey
          </p>
        </motion.div>

        {/* Status Message */}
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mb-8 p-4 rounded-xl text-white shadow-lg ${statusType === "success"
              ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
              : "bg-gradient-to-r from-red-500 to-red-600"
              }`}
          >
            <div className="flex items-center gap-3">
              <CheckBadgeIcon className="w-6 h-6" />
              <span className="font-medium">{statusMessage}</span>
            </div>
          </motion.div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
            <p className="text-lg font-semibold text-gray-700">Loading opportunities...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-4xl">⚠️</span>
            </div>
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
              <BriefcaseIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Openings Available</h3>
            <p className="text-gray-600">
              Check back soon for new opportunities!
            </p>
          </div>
        ) : (
          <>
            {/* Job Count */}
            <div className="mb-8">
              <p className="text-gray-600 text-center">
                <span className="font-bold text-emerald-600 text-lg">{jobs.length}</span>{" "}
                {jobs.length === 1 ? "position" : "positions"} available
              </p>
            </div>

            {/* Job Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {jobs.map((job, idx) => {
                const daysRemaining = getDaysRemaining(job.closing_date);
                const isUrgent = daysRemaining <= 7;

                return (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.3 }}
                    className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden border border-gray-100 hover:border-emerald-200"
                  >
                    {/* Card Header */}
                    <div className="p-6 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                          <BriefcaseIcon className="w-6 h-6" />
                        </div>

                        {isUrgent && (
                          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-600 animate-pulse">
                            Closing Soon
                          </span>
                        )}
                      </div>

                      <h2 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-emerald-600 transition-colors">
                        {job.title}
                      </h2>

  {job.category && (
  <div className="flex items-center gap-2">
    <span className="text-xs font-medium text-gray-500">
      Method of Recruitment:
    </span>
    <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
      <SparklesIcon className="w-3.5 h-3.5" />
      {job.category}
    </span>
  </div>
)}
                    </div>

                    {/* Card Body */}
<div className="p-6 flex-1 flex flex-col">
<div className="text-sm text-gray-600 mb-4 space-y-1">
    {job.description ? (
      job.description
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, idx) => (
          <p key={idx}>
            {line}
          </p>
        ))
    ) : (
      <p>No description provided</p>
    )}
  </div>



                      {/* Other Qualifications */}
 {job.other_qualifications && (
  <div className="mb-4">
    <h3 className="font-semibold text-sm text-gray-800 mb-2">
      Qualifications and Experiences
    </h3>
    {Array.isArray(job.other_qualifications) ? (
      job.other_qualifications.map((qual, idx) => (
        <p key={idx} className="text-xs text-gray-600">
          {qual}
        </p>
      ))
    ) : (
      <p className="text-xs text-gray-600 line-clamp-2">
        {job.other_qualifications}
      </p>
    )}
  </div>
)}

                  
      {/* Experience */}
      {job.required_experience && Number(job.required_experience) > 0 && (
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-700">
          <ClockIcon className="w-4 h-4 text-gray-500" />
          <span className="font-medium">
            {job.required_experience}{" "}
            {Number(job.required_experience) === 1 ? "year" : "years"} experience
          </span>
        </div>
      )}

                      {/* Closing Date */}
                      <div className="mt-auto pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                          <span className="flex items-center gap-1.5">
                            <ClockIcon className="w-4 h-4" />
                            Closes: {new Date(getDeadline(job.closing_date).getTime() - 1).toLocaleDateString()}
                          </span>
                          <span
                            className={`font-semibold ${isUrgent ? "text-red-600" : "text-emerald-600"
                              }`}
                          >
                            {daysRemaining} {daysRemaining === 1 ? "day" : "days"} left
                          </span>
                        </div>

                        {/* Apply Button */}
                        <button
                          onClick={() => navigate(`/apply/${job.id}`)}
                          className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                          Apply Now
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} Career Portal. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-emerald-600 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-emerald-600 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-emerald-600 transition-colors">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default JobList;
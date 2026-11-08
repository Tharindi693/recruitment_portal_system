import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Briefcase,
  ArrowLeft,
  X,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  CalendarDays,
  Layers,
  HelpCircle,
} from "lucide-react";

const API_BASE = "https://cecb.lk/backend/api";

// Order in which qualification type groups should be displayed
const TYPE_ORDER = ["Degree", "Diploma", "NVQ", "O/L", "A/L", "Membership", "Certificate"];

// Groups a flat qualifications array into { type: [quals] }, sorted per TYPE_ORDER
function groupQualificationsByType(qualifications) {
  const groups = {};
  qualifications.forEach((q) => {
    const type = q.type || "Certificate";
    if (!groups[type]) groups[type] = [];
    groups[type].push(q);
  });

  // Sort NVQ group by level ascending
  Object.keys(groups).forEach((type) => {
    if (type === "NVQ") {
      groups[type].sort((a, b) => Number(a.level || 0) - Number(b.level || 0));
    }
  });

  const orderedKeys = [
    ...TYPE_ORDER.filter((t) => groups[t]),
    ...Object.keys(groups).filter((t) => !TYPE_ORDER.includes(t)),
  ];

  return orderedKeys.map((type) => ({ type, items: groups[type] }));
}

/* ---------- shared style tokens ---------- */
const inputCls =
  "block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-60";

const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300/50";

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function Pill({ children, onRemove, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="-mr-1 rounded-full p-0.5 transition hover:bg-black/10"
          aria-label="Remove"
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
}

// Expandable Row Component
function JobRow({ job, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const active = String(job.enabled) === "1";

  return (
    <>
      <tr
        onClick={() => setOpen(!open)}
        className={`cursor-pointer border-b border-slate-100 transition hover:bg-slate-50 ${
          open ? "bg-slate-50" : ""
        }`}
      >
        <td className="w-12 px-4 py-3.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400">
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </td>
        <td className="px-4 py-3.5">
          <div className="font-semibold text-slate-900">{job.title}</div>
          <div className="mt-0.5 text-xs text-slate-500">{job.category || "-"}</div>
        </td>
        <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-700">
          {job.closing_date}
        </td>
        <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-500">
          {new Date(job.created_at).toLocaleDateString()}
        </td>
        <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-700">
          {job.required_experience || "0"} yrs
        </td>
        <td className="px-4 py-3.5">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
              active
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                : "bg-rose-50 text-rose-700 ring-rose-200"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-rose-500"}`}
            />
            {active ? "Active" : "Disabled"}
          </span>
        </td>
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(job.id);
              }}
              className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
              title="Edit"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(job.id);
              }}
              className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </td>
      </tr>

      {/* Expandable Details */}
      {open && (
        <tr className="border-b border-slate-100 bg-slate-50/70">
          <td colSpan={7} className="px-6 py-5">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Job Description
                </h4>
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {job.description || "No description provided"}
                </p>
              </div>

              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Required Qualifications
                </h4>
                {job.qualifications?.length ? (
                  <ul className="mb-4 space-y-2">
                    {job.qualifications.map((q, index) => (
                      <li
                        key={index}
                        className="rounded-lg border border-slate-200 bg-white p-3"
                      >
                        <div className="text-sm font-medium text-slate-900">{q.name}</div>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
                          {q.subject_stream && (
                            <span>
                              <span className="font-semibold text-slate-600">Stream:</span>{" "}
                              {q.subject_stream}
                            </span>
                          )}
                          <span>
                            <span className="font-semibold text-slate-600">Experience:</span>{" "}
                            {q.required_experience} Years
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mb-4 text-sm text-slate-500">No qualifications specified.</p>
                )}

                {job.other_qualifications && (
                  <>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Additional Skills
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {job.other_qualifications
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .map((skill, idx) => (
                          <Pill key={idx} tone="slate">
                            {skill}
                          </Pill>
                        ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

export default function JobManagement() {
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [jobs, setJobs] = useState([]);
  const [qualifications, setQualifications] = useState([]);
  const [newQualification, setNewQualification] = useState("");
  const [form, setForm] = useState({
    id: 0,
    title: "",
    description: "",
    category: "",
    closing_date: "", // "YYYY-MM-DD"
    enabled: true,
    qualifications: [], // [{ qualification_id, subject_stream, required_experience }]
    other_qualifications: "",
    required_experience: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [openTypes, setOpenTypes] = useState({});

  const qualRef = useRef(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [highlightQuals, setHighlightQuals] = useState(false);

  useEffect(() => {
    let storedUser = null;
    try {
      storedUser = JSON.parse(localStorage.getItem("user"));
    } catch (e) {
      storedUser = null;
    }
    if (!storedUser || storedUser.role !== "admin") {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    fetchJobs();
    fetchQualifications();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await axios.get(`${API_BASE}/jobs.php`);
      setJobs(res.data.jobs || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchQualifications = async () => {
    try {
      const res = await axios.get(`${API_BASE}/jobs.php?qualifications=1`);
      setQualifications(res.data.qualifications || []);
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setForm({
      id: 0,
      title: "",
      description: "",
      category: "",
      closing_date: "",
      enabled: true,
      qualifications: [],
      other_qualifications: "",
      required_experience: "",
    });
    setNewQualification("");
    setMessage("");
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  // Toggle a qualification on/off.
  const handleQualificationToggle = (id) => {
    id = Number(id);
    setForm((f) => {
      const exists = f.qualifications.find((q) => q.qualification_id === id);
      if (exists) {
        return {
          ...f,
          qualifications: f.qualifications.filter((q) => q.qualification_id !== id),
        };
      }
      return {
        ...f,
        qualifications: [
          ...f.qualifications,
          { qualification_id: id, subject_stream: "", required_experience: "" },
        ],
      };
    });
  };

  const handleQualDetailChange = (id, field, value) => {
    id = Number(id);
    setForm((f) => ({
      ...f,
      qualifications: f.qualifications.map((q) =>
        q.qualification_id === id ? { ...q, [field]: value } : q
      ),
    }));
  };

  const handleAddNewQualification = () => {
    const custom = newQualification.trim();
    if (!custom) return;

    setForm((f) => {
      const existing = f.other_qualifications
        ? f.other_qualifications.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      if (existing.includes(custom)) {
        return f;
      }
      const updated = existing.concat([custom]).join(", ");
      return { ...f, other_qualifications: updated };
    });

    setNewQualification("");
  };

  const handleRemoveChip = (chip) => {
    if (typeof chip === "number") {
      setForm((f) => ({
        ...f,
        qualifications: f.qualifications.filter((q) => q.qualification_id !== chip),
      }));
      return;
    }
    setForm((f) => {
      const arr = f.other_qualifications
        ? f.other_qualifications.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      const filtered = arr.filter((s) => s !== chip);
      return { ...f, other_qualifications: filtered.join(", ") };
    });
  };

  const handleEdit = async (jobId) => {
    try {
      const res = await axios.get(`${API_BASE}/jobs.php?id=${jobId}`);
      const job = res.data.job;

      setForm({
        id: parseInt(job.id),
        title: job.title || "",
        description: job.description || "",
        category: job.category || "",
        closing_date: job.closing_date ? String(job.closing_date).slice(0, 10) : "",
        enabled: String(job.enabled) === "1",
        qualifications: (job.qualifications || []).map((q) => ({
          qualification_id: Number(q.id),
          subject_stream: q.subject_stream || "",
          required_experience: q.required_experience ?? "",
        })),
        other_qualifications: job.other_qualifications || "",
        required_experience: job.required_experience || "",
      });
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      setMessage("");
    } catch (err) {
      console.error(err);
      setMessage("Failed to load job for edit.");
      setMessageType("error");
    }
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    try {
      await axios.delete(`${API_BASE}/jobs.php?id=${jobId}`);
      setMessage("Job deleted successfully.");
      setMessageType("success");
      fetchJobs();
      resetForm();
      setMessage("Job deleted successfully.");
    } catch (err) {
      console.error(err);
      setMessage("Failed to delete job.");
      setMessageType("error");
    }
  };

  // Step 1: validate, then ask the confirmation question
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.closing_date) {
      setMessage("Title and Closing Date are required.");
      setMessageType("error");
      return;
    }
    setConfirmOpen(true);
  };

  // YES -> publish
  const handleConfirmYes = () => {
    setConfirmOpen(false);
    saveJob();
  };

  // NO -> take the user to the qualifications section
  const handleConfirmNo = () => {
    setConfirmOpen(false);
    setTimeout(() => {
      qualRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightQuals(true);
      setTimeout(() => setHighlightQuals(false), 2500);
    }, 150);
  };

  // Step 2: the actual save
  const saveJob = async () => {
    setLoading(true);
    setMessage("");
    try {
      const dedupedQualsMap = new Map();
      form.qualifications.forEach((q) => {
        const qid = parseInt(q.qualification_id);
        if (!qid) return;
        dedupedQualsMap.set(qid, {
          qualification_id: qid,
          subject_stream: q.subject_stream || "",
          required_experience:
            q.required_experience === "" ? 0 : parseInt(q.required_experience) || 0,
        });
      });

      const payload = {
        job_id: form.id,
        title: form.title,
        description: form.description,
        category: form.category,
        closing_date: form.closing_date || "",
        enabled: form.enabled ? 1 : 0,
        qualifications: Array.from(dedupedQualsMap.values()),
        other_qualifications: form.other_qualifications || "",
        required_experience: form.required_experience || "",
      };

      if (form.id === 0) {
        await axios.post(`${API_BASE}/jobs.php`, payload);
        setMessage("Job created successfully.");
      } else {
        await axios.put(`${API_BASE}/jobs.php?id=${form.id}`, payload);
        setMessage("Job updated successfully.");
      }
      setMessageType("success");
      fetchJobs();
      const okMsg = form.id === 0 ? "Job created successfully." : "Job updated successfully.";
      resetForm();
      setMessage(okMsg);
    } catch (err) {
      console.error(err);
      setMessage("Error saving job.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const groupedQualifications = groupQualificationsByType(qualifications);
  const customSkills = (form.other_qualifications || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const selectedCount = form.qualifications.length + customSkills.length;

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Top banner */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate("/AdminDashboard")}
            className="group mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft
              size={16}
              className="transition-transform group-hover:-translate-x-1"
            />
            Back to Dashboard
          </button>

          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-emerald-500 text-white shadow-md shadow-blue-500/20">
              <Briefcase size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Job Management
              </h1>
              <p className="text-sm text-slate-500">
                Create, publish and manage job postings
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
        {/* Message Alert */}
        {message && (
          <div
            role="alert"
            className={`mb-6 flex items-start gap-3 rounded-xl border p-4 ${
              messageType === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            {messageType === "success" ? (
              <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
            ) : (
              <AlertCircle size={20} className="mt-0.5 shrink-0" />
            )}
            <p className="flex-1 text-sm font-medium">{message}</p>
            <button
              onClick={() => setMessage("")}
              className="rounded p-0.5 opacity-60 transition hover:opacity-100"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Form Section */}
        <section
          ref={formRef}
          className="mb-10 scroll-mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {form.id === 0 ? "Create New Job" : "Edit Job Posting"}
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Fill in the job details and requirements
              </p>
            </div>
            {form.id !== 0 && (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                Editing Mode
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-12">
              {/* LEFT COLUMN */}
              <div className="space-y-5 lg:col-span-7">
                <Field label="Job Title" required>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Senior Software Engineer"
                    className={inputCls}
                  />
                </Field>

                <Field label="Job Description">
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Describe the role, responsibilities and expectations"
                    className={`${inputCls} resize-y`}
                  />
                </Field>

                <Field label="Hiring Process" required>
                  <div className="relative">
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleInputChange}
                      required
                      className={`${inputCls} appearance-none pr-10 ${
                        form.category ? "" : "text-slate-400"
                      }`}
                    >
                      <option value="" disabled>
                        Select Hiring Method
                      </option>
                      <option value="Aptitude Test">Aptitude Test</option>
                      <option value="Interview">Interview</option>
                      <option value="Aptitude Test and Interview">
                        Aptitude Test and Interview
                      </option>
                    </select>
                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Closing Date" required>
                    <div className="relative">
                      <input
                        type="date"
                        name="closing_date"
                        value={form.closing_date}
                        min={todayStr()}
                        onChange={handleInputChange}
                        required
                        className={inputCls}
                      />
                    </div>
                  </Field>

                  <Field label="Overall Min. Experience">
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        name="required_experience"
                        value={form.required_experience}
                        onChange={handleInputChange}
                        placeholder="0"
                        className={`${inputCls} pr-16`}
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-400">
                        Years
                      </span>
                    </div>
                  </Field>
                </div>

                {/* Enable toggle */}
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Enable Job Posting</p>
                    <p className="text-xs text-slate-500">
                      Disabled jobs are hidden from applicants
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.enabled}
                    onClick={() => setForm((f) => ({ ...f, enabled: !f.enabled }))}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                      form.enabled ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                        form.enabled ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="lg:col-span-5">
                <div
                  ref={qualRef}
                  className={`rounded-xl border bg-slate-50 p-4 transition-all duration-500 ${
                    highlightQuals
                      ? "border-blue-400 bg-blue-50 ring-4 ring-blue-400/40"
                      : "border-slate-200"
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Required Qualifications
                    </h3>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                      {selectedCount} selected
                    </span>
                  </div>

                  <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                    {groupedQualifications.length === 0 && (
                      <p className="py-4 text-center text-sm text-slate-500">
                        No qualifications available.
                      </p>
                    )}
                    {groupedQualifications.map(({ type, items }) => {
                      const isOpen = !!openTypes[type];
                      const count = items.filter((q) =>
                        form.qualifications.some((fq) => fq.qualification_id === Number(q.id))
                      ).length;
                      return (
                        <div
                          key={type}
                          className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                        >
                          <button
                            type="button"
                            onClick={() => setOpenTypes((o) => ({ ...o, [type]: !o[type] }))}
                            className="flex w-full items-center justify-between px-3 py-2.5 text-left transition hover:bg-slate-50"
                          >
                            <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                              {type}
                              {count > 0 && (
                                <span className="rounded-full bg-blue-100 px-1.5 text-xs font-semibold text-blue-700">
                                  {count}
                                </span>
                              )}
                            </span>
                            <ChevronDown
                              size={16}
                              className={`text-slate-400 transition-transform ${
                                isOpen ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          {isOpen && (
                            <div className="space-y-1 border-t border-slate-100 px-3 py-2">
                              {items.map((q) => {
                                const selected = form.qualifications.find(
                                  (fq) => fq.qualification_id === Number(q.id)
                                );
                                return (
                                  <div key={q.id} className="py-1">
                                    <label className="flex cursor-pointer items-start gap-2.5">
                                      <input
                                        type="checkbox"
                                        checked={!!selected}
                                        onChange={() => handleQualificationToggle(Number(q.id))}
                                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                      />
                                      <span className="text-sm text-slate-700">{q.name}</span>
                                    </label>
                                    {selected && (
                                      <div className="ml-6 mt-2 flex flex-col gap-2 sm:flex-row">
                                        <input
                                          placeholder="Subject / Stream"
                                          value={selected.subject_stream}
                                          onChange={(e) =>
                                            handleQualDetailChange(
                                              Number(q.id),
                                              "subject_stream",
                                              e.target.value
                                            )
                                          }
                                          className={`${inputCls} !py-1.5`}
                                        />
                                        <div className="relative sm:w-28 sm:shrink-0">
                                          <input
                                            type="number"
                                            min="0"
                                            placeholder="Exp"
                                            value={selected.required_experience}
                                            onChange={(e) =>
                                              handleQualDetailChange(
                                                Number(q.id),
                                                "required_experience",
                                                e.target.value
                                              )
                                            }
                                            className={`${inputCls} !py-1.5 pr-10`}
                                          />
                                          <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-xs text-slate-400">
                                            Yrs
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Custom skill */}
                  <div className="mt-4 flex gap-2">
                    <input
                      placeholder="Add custom skill"
                      value={newQualification}
                      onChange={(e) => setNewQualification(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && (e.preventDefault(), handleAddNewQualification())
                      }
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={handleAddNewQualification}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-slate-900 px-3.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                    >
                      <Plus size={16} />
                      Add
                    </button>
                  </div>

                  {/* Selected summary */}
                  {selectedCount > 0 && (
                    <div className="mt-4 border-t border-slate-200 pt-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Selected
                      </p>
                      <div className="flex flex-col items-start gap-2">
                        {form.qualifications.map((fq) => {
                          const found = qualifications.find(
                            (q) => Number(q.id) === fq.qualification_id
                          );
                          if (!found) return null;
                          return (
                            <div key={fq.qualification_id}>
                              <Pill onRemove={() => handleRemoveChip(fq.qualification_id)}>
                                {found.name}
                              </Pill>
                              {(fq.subject_stream || fq.required_experience) && (
                                <span className="ml-1 mt-1 block text-xs text-slate-500">
                                  {fq.subject_stream ? `Stream: ${fq.subject_stream}` : ""}
                                  {fq.subject_stream && fq.required_experience ? " · " : ""}
                                  {fq.required_experience
                                    ? `Exp: ${fq.required_experience} yrs`
                                    : ""}
                                </span>
                              )}
                            </div>
                          );
                        })}

                        {customSkills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {customSkills.map((c, i) => (
                              <Pill key={i} tone="slate" onRemove={() => handleRemoveChip(c)}>
                                {c}
                              </Pill>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              {form.id !== 0 && (
                <button type="button" onClick={resetForm} className={btnSecondary}>
                  Cancel
                </button>
              )}
              <button type="submit" disabled={loading} className={btnPrimary}>
                {loading && <Loader2 size={16} className="animate-spin" />}
                {form.id === 0 ? "Publish Job" : "Update Job"}
              </button>
            </div>
          </form>
        </section>

        {/* Jobs List */}
        <section>
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">Job Listings</h2>
            <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
              {jobs.length}
            </span>
          </div>

          {jobs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Briefcase size={22} />
              </div>
              <p className="font-medium text-slate-700">No jobs found</p>
              <p className="mt-1 text-sm text-slate-500">
                Create your first job posting using the form above.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="w-12 px-4 py-3" />
                      {["Job Title", "Closing Date", "Created", "Experience", "Status", "Actions"].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <JobRow
                        key={job.id}
                        job={job}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Confirmation modal */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <HelpCircle size={22} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Required Qualifications</h3>
              <p className="mt-1.5 text-sm text-slate-600">
                Have you added the required qualifications for this job?
              </p>
            </div>
            <div className="flex justify-end gap-3 bg-slate-50 px-6 py-4">
              <button onClick={handleConfirmNo} className={btnSecondary}>
                No
              </button>
              <button onClick={handleConfirmYes} autoFocus className={btnPrimary}>
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
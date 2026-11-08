import React, { useState, useEffect ,useRef} from "react";
import { useNavigate } from "react-router-dom";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarDensitySelector,
  GridToolbarFilterButton,
} from "@mui/x-data-grid";
import {
  Download,
  Users,
  ArrowLeft,
  Mail,
  Phone,
  CreditCard,
  Calendar,
  User,
  XCircle,
  Trash2,
  CheckCircle,
  AlertCircle,
  Search
} from "lucide-react";

/* =======================
   Custom Toolbar
======================= */
function CustomToolbar() {
  return (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarDensitySelector />
      <GridToolbarFilterButton />
    </GridToolbarContainer>
  );
}

/* =======================
   Main Component
======================= */
export default function ApplicantsView() {
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState([]);
  const [jobList, setJobList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filterCreatedFrom, setFilterCreatedFrom] = useState("");
  const [filterCreatedTo, setFilterCreatedTo] = useState("");
  const [filterJobId, setFilterJobId] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [applicantToDelete, setApplicantToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 3 });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));

    if (!storedUser || storedUser.role !== "admin") {
      navigate("/login");
      return;
    }
  }, [navigate]);

  /* =======================
     EXPORT URL
  ======================= */
  const getExportUrl = () => {
    const params = new URLSearchParams();

    if (filterCreatedFrom)
      params.append("created_from", filterCreatedFrom);

    if (filterCreatedTo)
      params.append("created_to", filterCreatedTo);

    if (filterJobId) {
      params.append("job_id", filterJobId);
    }

    if (filterStatus !== "all") {
      params.append("status", filterStatus);
    }

    return `https://cecb.lk/backend/api/export_applicants_excel.php?${params.toString()}`;
  };

  /* =======================
     UPDATE STATUS
  ======================= */
 const updateApplicationStatus = async (applicationId, newStatus, applicantEmail = null) => {
  try {
    console.log("Sending:", { applicationId, newStatus, applicantEmail }); // ← debug

    const response = await fetch(
      "https://cecb.lk/backend/api/update_application_status.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application_id: applicationId,
          status: newStatus,
          applicant_email: applicantEmail,
        }),
      }
    );

    // ← Check raw response before parsing
    const rawText = await response.text();
    console.log("Raw PHP response:", rawText);

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      alert("PHP returned invalid JSON. Check console for raw output.");
      return;
    }

    console.log("Parsed response:", data);

    if (data.success) {
      setApplicants((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );

      if (newStatus === "approved") {
        alert("Application approved!");
      } else if (newStatus === "rejected") {
        if (data.email_failed) {
          alert("Application rejected but email failed: " + data.message);
        } else {
          alert("Application rejected and email sent to applicant.");
        }
      }
    } else {
      alert("Failed: " + data.message);
    }

  } catch (error) {
    // This only fires if fetch itself fails (network error)
    console.error("Fetch error:", error);
    alert("Network error: " + error.message);
  }
};


    // DELETE REJECTED APPLICATION
  
  const deleteRejectedApplication = async (applicationId) => {
    setIsDeleting(true);
    try {
      const response = await fetch(
        "https://cecb.lk/backend/api/delete_rejected_application.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            application_id: applicationId,
          }),
        }
      );

      const data = await response.json();



        if (!data.success) {
          alert("Email failed: " + data.message);
        } else {
          alert("Email sent!");
        }




      if (data.success) {
        // Remove from local state
        setApplicants((prev) => prev.filter((app) => app.id !== applicationId));
        alert("Application and associated files deleted successfully");
        setShowDeleteConfirm(false);
        setApplicantToDelete(null);
      } else {
        alert("Failed to delete: " + data.message);
      }
    } catch (error) {
      console.error("Error deleting application:", error);
      alert("Error deleting application");
    } finally {
      setIsDeleting(false);
    }
  };

  /* =======================
     GET STATUS BADGE
  ======================= */
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: <AlertCircle size={14} />,
        text: "Pending"
      },
      approved: {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: <CheckCircle size={14} />,
        text: "Approved"
      },
      rejected: {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: <XCircle size={14} />,
        text: "Rejected"
      }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${config.color}`}>
        {config.icon}
        {config.text}
      </div>
    );
  };

  /* =======================
     COLUMNS
  ======================= */
  const columns = [
    { field: "user_id", headerName: "User ID", width: 70, cellClassName: "pinned-col pinned-user_id", headerClassName: "pinned-col pinned-user_id" },
    { field: "job_id", headerName: "Job ID", width: 70, cellClassName: "pinned-col pinned-job_id", headerClassName: "pinned-col pinned-job_id" },

{
  field: "status",
  headerName: "Status",
  width: 130,
  cellClassName: "pinned-col pinned-status",
  headerClassName: "pinned-col pinned-status",
  renderCell: (params) => getStatusBadge(params.value || 'pending'),
},
{
  field: "applicant_details",
  headerName: "Applicant Details",
  width: 400,
  cellClassName: "pinned-col pinned-applicant_details",
  headerClassName: "pinned-col pinned-applicant_details",
      renderCell: (params) => {
        const row = params.row;
        return (
          <div className="py-2 space-y-1.5">
            {/* Name */}
            <div className="flex items-center gap-2">
              <User size={14} className="text-gray-500 flex-shrink-0" />
              <span className="font-semibold text-gray-800">
                {row.title} {row.full_name} {row.last_name}
              </span>
            </div>

            {/* Email & Phone */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5">
                <Mail size={13} className="text-blue-500 flex-shrink-0" />
                <a
                  href={`mailto:${row.email}`}
                  className="text-blue-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {row.email}
                </a>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone size={13} className="text-green-500 flex-shrink-0" />
                <a
                  href={`tel:${row.phone}`}
                  className="text-gray-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  {row.phone}
                </a>
              </div>
            </div>

            {/* NIC, DOB & Age */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <CreditCard size={13} className="text-purple-500 flex-shrink-0" />
                <span>{row.nic}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={13} className="text-orange-500 flex-shrink-0" />
                <span>{row.dob}</span>
              </div>
              <div className="px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium">
                Age: {row.age}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      field: "address",
      headerName: "Address",
      width: 250,
      renderCell: (params) => (
        <div className="text-sm text-gray-600 py-2">
          {params.value}
        </div>
      ),
    },
    {
      field: "cv",
      headerName: "CV",
      minWidth: 200,
      renderCell: (params) => {
      const cv = params?.value;

        if (!cv) return <span className="text-gray-400">No CV</span>;

        return (
          <a
            href={cv.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 font-medium hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {cv.filename}
          </a>
        );
      },
    },
    {
      field: "present_service_letter",
      headerName: "Present Service Letter",
      width: 250,
      renderCell: (params) => {
        const letter = params?.value;

        if (!letter) {
          return <span className="text-orange-600 font-medium text-sm">
      Submit at Interview
    </span>;
        }

        return (
          <a
            href={letter.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 font-medium hover:underline text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {letter.filename}
          </a>
        );
      },
    },
{
  field: "previous_service_letters",
  headerName: "Previous Service Letters",
  width: 280,
  renderCell: (params) => {
    const letters = params.value;

    // If no letters → show message
    if (!letters || letters.length === 0) {
      return (
        <span className="text-orange-700 font-medium text-sm">
          Submit at Interview
        </span>
      );
    }

    // If letters exist → show them
    return (
      <div className="flex flex-col gap-1 py-2">
        {letters.map((letter, index) => (
          <a
            key={index}
            href={letter.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-600 font-medium hover:underline text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {letter.filename}
          </a>  
        ))}
      </div>
    );
  },
},
    {
      field: "present_employment",
      headerName: "Present Employment",
      width: 350,
      renderCell: (params) => {
        const pe = params?.row?.present_employment;
        if (!pe) return "";
        return (
      <div className="whitespace-pre-line text-sm py-2">
      {`Designation: ${pe.designation}
      Organization: ${pe.institute}
      Duration: ${pe.start} to ${pe.end} (${pe.duration})`}
      </div>
        );
      },
    },
    {
      field: "previous_employments",
      headerName: "Previous Employments",
      width: 500,
      renderCell: (params) => {
        const prev = params?.row?.previous_employments;
        if (!prev || !prev.length) return "";
        return (
          <div className="whitespace-pre-line text-sm py-2">
            {prev
              .map(
                (e, i) =>
                  `${i + 1}: ${e.designation} at ${e.institute} (${e.start} to ${e.end}, ${e.duration})`
              )
              .join("\n")}
          </div>
        );
      },
    },
    {
      field: "qualifications",
      headerName: "Qualification Files",
      width: 400,
      renderCell: (params) => {
        const qualifications = params?.value;

        if (!qualifications || qualifications.length === 0) {
          return <span className="text-gray-400">No Qualifications</span>;
        }

        return (
          <div className="flex flex-col gap-2 py-2">
            {qualifications.map((qual, qualIndex) => (
              <div key={qualIndex} className="border-l-2 border-purple-400 pl-2">
                <div className="text-xs font-semibold text-purple-700 mb-1">
                  {qual.program_name || `Qualification ${qualIndex + 1}`}
                </div>
                {qual.files && qual.files.length > 0 ? (
                  <div className="flex flex-col gap-0.5">
                    {qual.files.map((file, fileIndex) => (
                      <a
                        key={fileIndex}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 font-medium hover:underline text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        📄 {file.filename}
                      </a>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400 text-xs">No files</span>
                )}
              </div>
            ))}
          </div>
        );
      },
    },
    { field: "submitted_at", headerName: "Submitted At", width: 180 },
{
  field: "actions",
  headerName: "Actions",
  width: 280,
  renderCell: (params) => {
    const status = params.row.status || 'pending';
    const applicationId = params.row.id;
    const applicantEmail = params.row.email; // ← grab email once here

    return (
      <div className="flex gap-2 py-2">

        {/* PENDING → Approve + Reject */}
        {status === 'pending' && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateApplicationStatus(applicationId, 'approved', applicantEmail); // ← added
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-xs font-medium"
            >
              <CheckCircle size={14} />
              Approve
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateApplicationStatus(applicationId, 'rejected', applicantEmail); // ← added
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-xs font-medium"
            >
              <XCircle size={14} />
              Reject
            </button>
          </>
        )}

        {/* APPROVED → Reject only */}
        {status === 'approved' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateApplicationStatus(applicationId, 'rejected', applicantEmail); // ← already had
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-xs font-medium"
          >
            <XCircle size={14} />
            Reject
          </button>
        )}

        {/* REJECTED → Approve + Delete */}
        {status === 'rejected' && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateApplicationStatus(applicationId, 'approved', applicantEmail); // ← added
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-xs font-medium"
            >
              <CheckCircle size={14} />
              Approve
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setApplicantToDelete(params.row);
                setShowDeleteConfirm(true);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition text-xs font-medium"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </>
        )}

      </div>
    );
  },
},
  ];

  /* =======================
     FETCH JOBS (Only Enabled)
  ======================= */
  useEffect(() => {
    fetch("https://cecb.lk/backend/api/get_jobs.php")
      .then((res) => res.json())
      .then((data) => {
        setJobList(data);
      })
      .catch(console.error);
  }, []);

  /* =======================
     LOAD APPLICANTS
  ======================= */
  const loadApplicants = async () => {
    if (!filterJobId) {
      alert("Please select a job first");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("job_id", filterJobId);
      params.append("status", filterStatus);

      const response = await fetch(
        `https://cecb.lk/backend/api/get_applicants_by_job.php?${params.toString()}`
      );
      const data = await response.json();
      setApplicants(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading applicants:", error);
      setApplicants([]);
      alert("Failed to load applicants");
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     RENDER
  ======================= */
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white rounded-2xl shadow-xl p-6">

        {/* Back Button */}
        <button
          onClick={() => navigate("/AdminDashboard")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Dashboard</span>
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Users className="text-blue-600" />
          <h1 className="text-2xl font-bold">Applicants</h1>
        </div>

        {/* Filters Section */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter Options</h3>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
            {/* Job Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Select Job *
              </label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={filterJobId}
                onChange={(e) => setFilterJobId(e.target.value)}
              >
                <option value="">Select a Job</option>
                {jobList.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Application Status
              </label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Job Created From
              </label>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={filterCreatedFrom}
                onChange={(e) => setFilterCreatedFrom(e.target.value)}
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Job Closing Date To
              </label>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={filterCreatedTo}
                onChange={(e) => setFilterCreatedTo(e.target.value)}
              />
            </div>

            {/* Load Button */}
            <div className="flex items-end">
              <button
                onClick={loadApplicants}
                disabled={loading || !filterJobId}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    Load Applicants
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Export Button */}
          <div className="flex justify-end">
            <a
              href={getExportUrl()}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium"
              onClick={(e) => {
                if (!filterJobId) {
                  e.preventDefault();
                  alert("Please select a job and load applicants first");
                }
              }}
            >
              <Download size={16} />
              Export to Excel
            </a>
          </div>
        </div>

        {/* Results Summary */}
        {applicants.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Showing {applicants.length} applicant{applicants.length !== 1 ? 's' : ''}</span>
              {filterJobId && jobList.find(j => j.id === parseInt(filterJobId)) && (
                <> for <span className="font-semibold">{jobList.find(j => j.id === parseInt(filterJobId)).title}</span></>
              )}
              {filterStatus !== 'all' && (
                <> with status: <span className="font-semibold capitalize">{filterStatus}</span></>
              )}
            </p>
          </div>
        )}

        {/* Data Grid */}
        <div className="w-full">
          {applicants.length === 0 && !loading ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Users className="mx-auto text-gray-400 mb-3" size={48} />
              <p className="text-gray-600 font-medium">No applicants loaded</p>
              <p className="text-sm text-gray-500 mt-1">
                {filterJobId ? "Click 'Load Applicants' to view applications" : "Select a job and click 'Load Applicants'"}
              </p>
            </div>
          ) : (
            
// Remove autoHeight, give it a fixed height instead
<div style={{ width: "100%" }}>
  <DataGrid
    autoHeight
    rows={applicants}
    columns={columns}
    getRowId={(row) => row.id}
    getRowHeight={() => "auto"}
    loading={loading}
    paginationModel={paginationModel}
    onPaginationModelChange={setPaginationModel}
    pageSizeOptions={[3, 5, 10, 20]}
    slots={{ toolbar: CustomToolbar }}
    sx={{
      "& .pinned-user_id": { position: "sticky", left: 0, zIndex: 2, backgroundColor: "#fff" },
      "& .pinned-job_id": { position: "sticky", left: 70, zIndex: 2, backgroundColor: "#fff" },
      "& .pinned-status": { position: "sticky", left: 140, zIndex: 2, backgroundColor: "#fff" },
      "& .pinned-applicant_details": {
        position: "sticky",
        left: 270,
        zIndex: 2,
        backgroundColor: "#fff",
        borderRight: "2px solid #e0e0e0",
      },
      "& .MuiDataGrid-columnHeader.pinned-col": {
        zIndex: 3,
        backgroundColor: "#f9fafb",
      },
    }}
  />
</div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Delete Application</h3>
            </div>

            <p className="text-gray-600 mb-4">
              Are you sure you want to permanently delete this application and all associated files?
            </p>

            {applicantToDelete && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                <p className="text-sm font-semibold text-gray-800 mb-1">
                  {applicantToDelete.title} {applicantToDelete.full_name} {applicantToDelete.last_name}
                </p>
                <p className="text-xs text-gray-600">{applicantToDelete.email}</p>
                <p className="text-xs text-gray-600">Job: {applicantToDelete.job_title}</p>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
              <p className="text-xs text-yellow-800">
                ⚠️ This action cannot be undone. All uploaded files will be permanently deleted from the server.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setApplicantToDelete(null);
                }}
                className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteRejectedApplication(applicantToDelete.id)}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
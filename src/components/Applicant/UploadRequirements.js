import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const UploadRequirements = () => {
  const { jobId } = useParams();
  const [loading, setLoading] = useState(true);

  const [qualifications, setQualifications] = useState([]);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [jobTitle, setJobTitle] = useState("");


  const appID = localStorage.getItem("application_ID");
  const userID = localStorage.getItem("user_id");
  const job = JSON.parse(localStorage.getItem("job"));
  const email = localStorage.getItem("user_email");

  const emptySet = () => ({
  programName: "",
  result: "",
  effectiveDate: "",
  institution: "",
  remark: "",
  files: [null],
});

const isSetEmpty = (set) =>
  !set.programName.trim() &&
  !set.result.trim() &&
  !set.effectiveDate &&
  !set.institution.trim() &&
  !set.remark.trim() &&
  !set.files.some((f) => f instanceof File);





  // ← ADD THIS — fetch job title using jobId from URL
useEffect(() => {
  axios
    .get(`https://cecb.lk/backend/api/get_jobs.php?id=${jobId}`)
    .then((res) => {
      // adjust the key based on what your API returns
      const title = res.data?.title || res.data?.[0]?.title || "";
      setJobTitle(title);
    })
    .catch(() => console.warn("Could not fetch job title"));
}, [jobId]);




  // === Fetch qualifications ===
/*   useEffect(() => {
    axios
      .get(
        `https://cecb.lk/backend/api/job_requirements.php?job_id=${jobId}`
      )
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length) {
          setQualifications(res.data);

          const init = {};
          res.data.forEach((q) => {
            init[q.id] = [
              {
                programName: "",
                result: "",
                effectiveDate: "",
                institution: "",
                remark: "",
                files: [null],
              },
            ];
          });
          setFormData(init);
        } else {
          setError("No qualifications found for this job.");
        }
      })
      .catch(() => setError("Failed to load qualifications."));
  }, [jobId]); */

  useEffect(() => {
  axios
    .get(`https://cecb.lk/backend/api/job_requirements.php?job_id=${jobId}`)
    .then((res) => {
      const list = Array.isArray(res.data) ? res.data : [];
      setQualifications(list);
      const init = {};
      list.forEach((q) => { init[q.id] = [emptySet()]; });
      setFormData(init);
    })
    .catch(() => setError("Failed to load qualifications."))
    .finally(() => setLoading(false));
}, [jobId]);

  // === Helpers ===
  /* const updateSet = (qid, index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev[qid]];
      updated[index][field] = value;
      return { ...prev, [qid]: updated };
    });
  };

  const addSet = (qid) => {
    setFormData((prev) => ({
      ...prev,
      [qid]: [
        ...prev[qid],
        {
          programName: "",
          result: "",
          effectiveDate: "",
          institution: "",
          remark: "",
          files: [null],
        },
      ],
    }));
  };

  const removeSet = (qid, index) => {
    setFormData((prev) => {
      const updated = [...prev[qid]];
      updated.splice(index, 1);
      return {
        ...prev,
        [qid]:
          updated.length > 0
            ? updated
            : [
                {
                  programName: "",
                  result: "",
                  effectiveDate: "",
                  institution: "",
                  remark: "",
                  files: [null],
                },
              ],
      };
    });
  }; */

  const updateSet = (qid, index, field, value) =>
  setFormData((prev) => ({
    ...prev,
    [qid]: prev[qid].map((s, i) => (i === index ? { ...s, [field]: value } : s)),
  }));

const addSet = (qid) =>
  setFormData((prev) => ({ ...prev, [qid]: [...prev[qid], emptySet()] }));

const removeSet = (qid, index) =>
  setFormData((prev) => {
    const updated = prev[qid].filter((_, i) => i !== index);
    return { ...prev, [qid]: updated.length ? updated : [emptySet()] };
  });

  const updateFile = (qid, sIdx, fIdx, file) => {
    setFormData((prev) => {
      const updated = [...prev[qid]];
      const files = [...updated[sIdx].files];
      files[fIdx] = file;
      updated[sIdx].files = files;
      return { ...prev, [qid]: updated };
    });
  };

  const addFile = (qid, sIdx) => {
    setFormData((prev) => {
      const updated = [...prev[qid]];
      updated[sIdx].files.push(null);
      return { ...prev, [qid]: updated };
    });
  };

  const removeFile = (qid, sIdx, fIdx) => {
    setFormData((prev) => {
      const updated = [...prev[qid]];
      const files = [...updated[sIdx].files];
      files.splice(fIdx, 1);
      updated[sIdx].files = files.length ? files : [null];
      return { ...prev, [qid]: updated };
    });
  };

  // === Submit ===
  /* const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    if (!appID || !jobId || !userID) {
      setError("Missing required identifiers.");
      setSubmitting(false);
      return;
    }

    try {
      const fd = new FormData();
      fd.append("application_id", appID);
      fd.append("job_id", jobId);
      fd.append("user_id", userID);

      let hasFile = false;

      Object.entries(formData).forEach(([qid, sets]) => {
        sets.forEach((set, sIdx) => {
          fd.append(
            `qualification_${qid}_sets[${sIdx}][programName]`,
            set.programName
          );
          fd.append(
            `qualification_${qid}_sets[${sIdx}][result]`,
            set.result
          );
          fd.append(
            `qualification_${qid}_sets[${sIdx}][effectiveDate]`,
            set.effectiveDate
          );
          fd.append(
            `qualification_${qid}_sets[${sIdx}][institution]`,
            set.institution
          );
          fd.append(
            `qualification_${qid}_sets[${sIdx}][remark]`,
            set.remark
          );

          set.files.forEach((file, fIdx) => {
            if (file instanceof File) {
              fd.append(
                `qualification_${qid}_sets[${sIdx}][file_${fIdx}]`,
                file
              );
              hasFile = true;
            }
          });
        });
      });

      if (!hasFile) {
        setError("Please upload at least one document.");
        setSubmitting(false);
        return;
      }

      const res = await axios.post(
        "https://cecb.lk/backend/api/submit_requirements.php",
        fd
      );

if (res.data?.success) {

  // First success popup
  alert("Qualifications submitted successfully!");

  try {
    // Send confirmation email
    const emailRes = await axios.post(
      "https://cecb.lk/backend/api/send_success_email.php",
      {
        email: email,
        message:
          "Your qualifications were submitted successfully.",
          //job_title: job?.title,  
          job_title: jobTitle,              
          reference_number: appID                   
      }
    );

    // Check email API response
    if (emailRes.data.success) {
      alert("Confirmation email sent successfully!");
    } else {
      alert("Submission successful, but email could not be sent.");
    }

  } catch (err) {
    console.error("Email sending failed:", err);
    alert("Submission successful, but email sending failed.");
  }
  
  // Reset form
  const reset = {};
  qualifications.forEach((q) => {
    reset[q.id] = [
      {
        programName: "",
        result: "",
        effectiveDate: "",
        institution: "",
        remark: "",
        files: [null],
      },
    ];
  });

  setFormData(reset);

  localStorage.clear();

  setTimeout(() => {
    navigate("/jobs");
  }, 500);

} else {
  setError(res.data?.message || "Submission failed.");
}
    } catch (err) {
      setError(err.message || "Submission error.");
    } finally {
      setSubmitting(false);
    }
  }; */

  const handleSubmit = async (e) => {
  e.preventDefault();
  setSubmitting(true);
  setError("");

  if (!appID || !jobId || !userID) {
    setError("Missing required identifiers.");
    setSubmitting(false);
    return;
  }

  try {
    const fd = new FormData();
    fd.append("application_id", appID);
    fd.append("job_id", jobId);
    fd.append("user_id", userID);

    let filledSets = 0;

    Object.entries(formData).forEach(([qid, sets]) => {
      let idx = 0;
      sets.forEach((set) => {
        if (isSetEmpty(set)) return; // skip blank sets

        const p = `qualification_${qid}_sets[${idx}]`;
        fd.append(`${p}[programName]`, set.programName);
        fd.append(`${p}[result]`, set.result);
        fd.append(`${p}[effectiveDate]`, set.effectiveDate);
        fd.append(`${p}[institution]`, set.institution);
        fd.append(`${p}[remark]`, set.remark);

        set.files.forEach((file, fIdx) => {
          if (file instanceof File) fd.append(`${p}[file_${fIdx}]`, file);
        });

        idx++;
        filledSets++;
      });
    });

    fd.append("has_qualifications", filledSets > 0 ? "1" : "0");

    const res = await axios.post(
      "https://cecb.lk/backend/api/submit_requirements.php",
      fd
    );

    if (!res.data?.success) {
      setError(res.data?.message || "Submission failed.");
      return;
    }

    alert(
      filledSets > 0
        ? "Qualifications submitted successfully!"
        : "Application submitted successfully!"
    );

    if (email) {
      try {
        const emailRes = await axios.post(
          "https://cecb.lk/backend/api/send_success_email.php",
          {
            email,
            message:
              filledSets > 0
                ? "Your qualifications were submitted successfully."
                : "Your application was submitted successfully.",
            job_title: jobTitle,
            reference_number: appID,
          }
        );
        if (!emailRes.data?.success) {
          alert("Submission successful, but email could not be sent.");
        }
      } catch (err) {
        console.error("Email sending failed:", err);
        alert("Submission successful, but email sending failed.");
      }
    }

    const reset = {};
    qualifications.forEach((q) => { reset[q.id] = [emptySet()]; });
    setFormData(reset);

    localStorage.removeItem("application_ID");
    localStorage.removeItem("job");
    setTimeout(() => navigate("/jobs"), 500);
  } catch (err) {
    setError(err.message || "Submission error.");
  } finally {
    setSubmitting(false);
  }
};
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
     <div className="flex items-center mb-4">
{/*     <button
      type="button"
      onClick={() => navigate("/jobs")}
      className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
    >
      ← Back
    </button> */}
    
  </div>
      <h1 className="text-3xl font-bold text-center mb-6">
        Upload Required Qualifications
      </h1>

      {error && (
        <div className="mb-4 rounded-md bg-red-100 px-4 py-3 text-red-700">
          {error}
        </div>
      )}
      {!loading && qualifications.length === 0 && !error && (
  <div className="mb-4 rounded-md bg-blue-100 px-4 py-3 text-blue-700">
    This job has no qualification requirements. You can submit your application directly.
  </div>
)}

      <form onSubmit={handleSubmit} className="space-y-8">
        {qualifications.map((q) => (
          <div key={q.id} className="rounded-xl border bg-blue-50 p-6">
            <h2 className="text-xl font-semibold text-blue-700 mb-4">
              {q.qualification_name}
            </h2>

            {(formData[q.id] || []).map((set, sIdx) => (
              <div
                key={sIdx}
                className="mb-6 rounded-lg bg-white p-5 border"
              >
                <div className="flex justify-between mb-4">
                  <p className="font-semibold">Set #{sIdx + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeSet(q.id, sIdx)}
                    disabled={formData[q.id].length === 1}
                    className="text-sm text-red-600 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>

                {/* Program Name */}
                <Field
                  label="Program Name"
                  value={set.programName}
                  onChange={(e) =>
                    updateSet(q.id, sIdx, "programName", e.target.value)
                  }
                  helper="Must match your certificate or transcript exactly"
                />

                {/* Result */}
                <Field
                  label="Result / Classification"
                  value={set.result}
                  onChange={(e) =>
                    updateSet(q.id, sIdx, "result", e.target.value)
                  }
                  helper="Examples: Pass, Merit, Distinction, First Class, Second Class Upper, Second Class Lower"
                />

                {/* Date & Institution */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="Effective Date"
                    type="date"
                    value={set.effectiveDate}
                    onChange={(e) =>
                      updateSet(q.id, sIdx, "effectiveDate", e.target.value)
                    }
                  />
                  <Field
                    label="Institution"
                    value={set.institution}
                    onChange={(e) =>
                      updateSet(q.id, sIdx, "institution", e.target.value)
                    }
                  />
                </div>

                {/* Remark */}
                <div className="mt-4">
                  <label className="block text-sm font-semibold">
                    Remark (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={set.remark}
                    onChange={(e) =>
                      updateSet(q.id, sIdx, "remark", e.target.value)
                    }
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </div>

                {/* Files */}
                <div className="mt-4">
                  <p className="text-sm font-semibold mb-2">
                    Supporting Documents
                  </p>

                  {set.files.map((_, fIdx) => (
                    <div key={fIdx} className="flex gap-2 mb-2">
                      <input
                        type="file"
                        //required={fIdx === 0}
                        onChange={(e) =>
                          updateFile(
                            q.id,
                            sIdx,
                            fIdx,
                            e.target.files[0]
                          )
                        }
                        className="w-full text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(q.id, sIdx, fIdx)}
                        disabled={set.files.length === 1}
                        className="text-red-600 disabled:opacity-50"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addFile(q.id, sIdx)}
                    className="text-sm text-blue-600 mt-2"
                  >
                    + Add another file
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => addSet(q.id)}
              className="text-blue-700 font-semibold text-sm"
            >
              + Add another qualification set
            </button>
          </div>
        ))}

        <button
          type="submit"
          disabled={submitting || loading}
          className="w-full rounded-lg bg-green-600 text-white py-3 font-semibold hover:bg-green-700 disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit All Qualifications"}
        </button>
      </form>
    </div>
  );
};

// === Reusable Input Field ===
const Field = ({ label, helper, type = "text", ...props }) => (
  <div className="mb-4">
    <label className="block text-sm font-semibold">{label}</label>
    <input
      type={type}
      {...props}
      //required
      className="mt-1 w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-200"
    />
    {helper && <p className="text-xs text-gray-500 mt-1">{helper}</p>}
  </div>
);

export default UploadRequirements;

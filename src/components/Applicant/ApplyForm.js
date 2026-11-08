import React, { useState, useEffect } from 'react';
import {
  Box, Button, Container, TextField, Typography, 
  Paper, Stepper, Step, StepLabel, IconButton, MenuItem, 
  Divider, Stack
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { styled } from "@mui/material/styles";
import { Checkbox, FormControlLabel } from "@mui/material";

const API_BASE = "https://cecb.lk/backend/api";

const steps = ['Personal Info', 'Present Employment', 'Previous Employment', 'Upload CV'];

const RoundedField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 8,
    backgroundColor: "#ffffff",
    "& fieldset": {
      borderColor: "#e0e0e0",
    },
    "&:hover fieldset": {
      borderColor: "#6c63ff",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#6c63ff",
      borderWidth: 2,
    },
  },
  "& .MuiInputBase-input": {
    padding: "12px 16px",
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 8,
  textTransform: 'none',
  padding: '10px 24px',
  fontWeight: 500,
  boxShadow: 'none',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(108, 99, 255, 0.2)',
  }
}));

const FileUploadButton = styled(Button)(({ theme }) => ({
  borderRadius: 8,
  textTransform: 'none',
  padding: '10px 20px',
  border: '2px dashed #6c63ff',
  color: '#6c63ff',
  backgroundColor: '#f8f7ff',
  fontWeight: 500,
  '&:hover': {
    backgroundColor: '#f0eeff',
    border: '2px dashed #5548e0',
  }
}));

export default function ApplyJobForm() {
  const { id } = useParams();
  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [job, setJob] = useState(null);
  const navigate = useNavigate();
  const userId = localStorage.getItem('user_id');

  const [presentServiceLetter, setPresentServiceLetter] = useState(null);
  const [previousServiceLetters, setPreviousServiceLetters] = useState([]);

  const [previousSubmitAtInterview, setPreviousSubmitAtInterview] = useState([]);

  const [submitAtInterview, setSubmitAtInterview] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    fullName: '',
    lastname: '',
    dob: null,
    age: '',
    nic: '',
    maritalStatus: '',
    address: '',
    phone: '',
    email: '',
    whatsappNumber: '',
    cv: null,
    presentEmployment: { institute: '', designation: '', start: null, end: null, duration: '' },
    previousEmployment: []
  });

  const [errors, setErrors] = useState({});
  const [cvFile, setCvFile] = React.useState(null);

  useEffect(() => {
    axios.get(`${API_BASE}/jobs.php?id=${id}`)
      .then(res => {
        console.log(res.data.job.required_experience);
        localStorage.setItem("req_exp", res.data.job.required_experience * 12)
        
        setJob(res.data.job);
        
        
        setFormData(prev => ({
          ...prev,
          presentEmployment: {
            ...prev.presentEmployment,
            end: res.data.job.closing_date ? new Date(res.data.job.closing_date) : null
          }
        }));
      });
  }, [id]);

  const calculateAge = (dob) => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const calculateDuration = (start, end) => {
  if (!start || !end) return '';

  const s = new Date(start);
  const e = new Date(end);

  if (
    isNaN(s.getTime()) ||
    isNaN(e.getTime())
  ) {
    return '';
  }

  if (e <= s) {
    return '';
  }

  const totalMonths =
    (e.getFullYear() - s.getFullYear()) * 12 +
    (e.getMonth() - s.getMonth());

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  let result = '';

  if (years > 0) {
    result += `${years} year${years > 1 ? 's' : ''} `;
  }

  if (months > 0) {
    result += `${months} month${months > 1 ? 's' : ''}`;
  }

  if (!result) {
    result = '0 months';
  }

  return result.trim();
};


// Calculate months between two dates
const calculateMonths = (start, end) => {
  if (!start || !end) {
    return 0;
  }

  const s = new Date(start);
  const e = new Date(end);

  // Invalid date protection
  if (
    isNaN(s.getTime()) ||
    isNaN(e.getTime())
  ) {
    return 0;
  }

  // Prevent negative experience
  if (e <= s) {
    return 0;
  }

  const totalMonths =
    (e.getFullYear() - s.getFullYear()) * 12 +
    (e.getMonth() - s.getMonth());

  return Math.max(0, totalMonths);
};


// Calculate all previous employment experience
const calculatePreviousMonths = () => {
  return formData.previousEmployment.reduce(
    (total, employment) => {
      const months = calculateMonths(
        employment.start,
        employment.end
      );

      return total + months;
    },
    0
  );
};


// Calculate present employment experience
const calculatePresentMonths = () => {
  return calculateMonths(
    formData.presentEmployment.start,
    formData.presentEmployment.end
  );
};


// Check required experience
const hasRequiredExperience = () => {
  const requiredExp =
    Number(localStorage.getItem("req_exp")) || 0;

  const previousMonths =
    calculatePreviousMonths();

  const presentMonths =
    calculatePresentMonths();

  const totalMonths =
    previousMonths + presentMonths;

  console.log("===== EXPERIENCE CHECK =====");
  console.log("Required:", requiredExp, "months");
  console.log("Previous:", previousMonths, "months");
  console.log("Present:", presentMonths, "months");
  console.log("Total:", totalMonths, "months");
  console.log("============================");

  return totalMonths >= requiredExp;
};

  









  const formatInitials = (value) => {
    return value
      .replace(/[^a-zA-Z]/g, '')
      .toUpperCase()
      .split('')
      .join('.') + (value ? '.' : '');
  };

  const capitalizeFirst = (value) => {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Clear error for this field when user starts typing
    setErrors(prev => ({ ...prev, [name]: '' }));

    setFormData(prev => ({
      ...prev,
      [name]:
        name === 'fullName'
          ? formatInitials(value)
          : name === 'lastname'
            ? capitalizeFirst(value)
            : value,
      ...(name === 'dob' ? { age: calculateAge(value) } : {})
    }));
  };

  const handleDateChange = (name, value) => {
    setErrors(prev => ({ ...prev, [name]: '' }));

    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'dob' ? { age: calculateAge(value) } : {})
    }));
  };

  const handlePresentChange = (e) => {
  const { name, value } = e.target;

  // Clear error for this field
  setErrors(prev => ({
    ...prev,
    [`present${name.charAt(0).toUpperCase() + name.slice(1)}`]: ''
  }));

  const updated = {
    ...formData.presentEmployment,
    [name]: value
  };

  // Calculate display duration
  if (updated.start && updated.end) {
    updated.duration = calculateDuration(
      updated.start,
      updated.end
    );
  }

  setFormData(prev => ({
    ...prev,
    presentEmployment: updated
  }));
};

 const handlePresentDateChange = (name, value) => {
  // Clear error for this field
  setErrors(prev => ({
    ...prev,
    [`present${name.charAt(0).toUpperCase() + name.slice(1)}`]: ''
  }));

  const updated = {
    ...formData.presentEmployment,
    [name]: value
  };

  // Calculate display duration
  if (updated.start && updated.end) {
    updated.duration = calculateDuration(
      updated.start,
      updated.end
    );
  }

  setFormData(prev => ({
    ...prev,
    presentEmployment: updated
  }));
};

  const handlePreviousChange = (index, e) => {
  const { name, value } = e.target;

  // Clear error for this field
  setErrors(prev => ({
    ...prev,
    [`prev${name.charAt(0).toUpperCase() + name.slice(1)}${index}`]: ''
  }));

  const updated = [...formData.previousEmployment];

  updated[index] = {
    ...updated[index],
    [name]: value
  };

  // Calculate display duration
  if (updated[index].start && updated[index].end) {
    updated[index].duration = calculateDuration(
      updated[index].start,
      updated[index].end
    );
  }

  setFormData(prev => ({
    ...prev,
    previousEmployment: updated
  }));
};

  const handlePreviousDateChange = (index, name, value) => {
  // Clear error for this field
  setErrors(prev => ({
    ...prev,
    [`prev${name.charAt(0).toUpperCase() + name.slice(1)}${index}`]: ''
  }));

  const updated = [...formData.previousEmployment];

  updated[index] = {
    ...updated[index],
    [name]: value
  };

  // Calculate display duration
  if (updated[index].start && updated[index].end) {
    updated[index].duration = calculateDuration(
      updated[index].start,
      updated[index].end
    );
  }

  setFormData(prev => ({
    ...prev,
    previousEmployment: updated
  }));
};
  const addPrevious = () => {
    setFormData(prev => ({
      ...prev,
      previousEmployment: [...prev.previousEmployment, { institute: '', designation: '', start: null, end: null, duration: '' }]
    }));
  };

  const removePrevious = (i) => {
    const updated = [...formData.previousEmployment];
    updated.splice(i, 1);
    setFormData(prev => ({ ...prev, previousEmployment: updated }));
  };

  const handleCVChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, cv: 'Please upload a PDF, DOC, or DOCX file' }));
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, cv: 'File size must be less than 5MB' }));
        return;
      }

      setErrors(prev => ({ ...prev, cv: '' }));
      setFormData(prev => ({ ...prev, cv: file }));
      setCvFile(file);
    }
  };

  const handleServiceLetterChange = (file, type, index = null) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      if (type === 'present') {
        setErrors(prev => ({ ...prev, presentServiceLetter: 'Please upload a PDF, DOC, or DOCX file' }));
      } else {
        setErrors(prev => ({ ...prev, [`prevServiceLetter${index}`]: 'Please upload a PDF, DOC, or DOCX file' }));
      }
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      if (type === 'present') {
        setErrors(prev => ({ ...prev, presentServiceLetter: 'File size must be less than 5MB' }));
      } else {
        setErrors(prev => ({ ...prev, [`prevServiceLetter${index}`]: 'File size must be less than 5MB' }));
      }
      return;
    }

    // Clear errors and set file
    if (type === 'present') {
      setErrors(prev => ({ ...prev, presentServiceLetter: '' }));
      setPresentServiceLetter(file);
    } else {
      setErrors(prev => ({ ...prev, [`prevServiceLetter${index}`]: '' }));
      const files = [...previousServiceLetters];
      files[index] = file;
      setPreviousServiceLetters(files);
    }
  };

  const validateStep = (step) => {
    let tempErrors = {};

    if (step === 0) {
      // Title validation
      if (!formData.title) {
        tempErrors.title = "Title is required";
      }

      // Initials validation
      if (!formData.fullName) {
        tempErrors.fullName = "Initials are required";
      } else if (formData.fullName.length < 3) {
        tempErrors.fullName = "Please enter valid initials (e.g., A.B.C.)";
      }

      // Last name validation
      if (!formData.lastname) {
        tempErrors.lastname = "Last name is required";
      } else if (formData.lastname.length < 2) {
        tempErrors.lastname = "Last name must be at least 2 characters";
      } else if (!/^[a-zA-Z\s]+$/.test(formData.lastname)) {
        tempErrors.lastname = "Last name can only contain letters";
      }

      // Date of birth validation
      if (!formData.dob) {
        tempErrors.dob = "Date of birth is required";
      } else {
        const age = calculateAge(formData.dob);
        if (age < 18) {
          tempErrors.dob = "You must be at least 18 years old";
        } else if (age > 65) {
          tempErrors.dob = "Age cannot exceed 65 years";
        }
      }

      // NIC validation
      if (!formData.nic) {
        tempErrors.nic = "NIC is required";
      } else if (!/^(\d{9}[vVxX]|\d{12})$/.test(formData.nic)) {
        tempErrors.nic = "NIC must be 10 characters (9 digits + V/X) or 12 digits";
      }

      // Marital status validation
      if (!formData.maritalStatus) {
        tempErrors.maritalStatus = "Marital status is required";
      }

      // Address validation
      if (!formData.address) {
        tempErrors.address = "Address is required";
      } else if (formData.address.length < 10) {
        tempErrors.address = "Please enter a complete address (minimum 10 characters)";
      }

      // Phone validation
      if (!formData.phone) {
        tempErrors.phone = "Phone number is required";
      } else if (!/^0\d{9}$/.test(formData.phone)) {
        tempErrors.phone = "Phone must be 10 digits starting with 0";
      }

      // WhatsApp validation
      if (!formData.whatsappNumber) {
        tempErrors.whatsappNumber = "WhatsApp number is required";
      } else if (!/^0\d{9}$/.test(formData.whatsappNumber)) {
        tempErrors.whatsappNumber = "WhatsApp must be 10 digits starting with 0";
      }

      // Email validation
      if (!formData.email) {
        tempErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        tempErrors.email = "Please enter a valid email address";
      }

    } else if (step === 1) {
      const pe = formData.presentEmployment;

      // Organization validation
      if (!pe.institute) {
        tempErrors.presentInstitute = "Organization is required";
      } else if (pe.institute.length < 2) {
        tempErrors.presentInstitute = "Organization name must be at least 2 characters";
      }

      // Designation validation
      if (!pe.designation) {
        tempErrors.presentDesignation = "Designation is required";
      } else if (pe.designation.length < 2) {
        tempErrors.presentDesignation = "Designation must be at least 2 characters";
      }

      // Start date validation
      if (!pe.start) {
        tempErrors.presentStart = "Start date is required";
      } else {
        const startDate = new Date(pe.start);
        const today = new Date();
        if (startDate > today) {
          tempErrors.presentStart = "Start date cannot be in the future";
        }
      }

      // Service letter validation
      if (!submitAtInterview && !presentServiceLetter) {
  tempErrors.presentServiceLetter =
    "Present employment service letter is required";
}

    } else if (step === 2) {
      formData.previousEmployment.forEach((item, i) => {
        // Organization validation
        if (!item.institute) {
          tempErrors[`prevInstitute${i}`] = "Organization is required";
        } else if (item.institute.length < 2) {
          tempErrors[`prevInstitute${i}`] = "Organization name must be at least 2 characters";
        }

        // Designation validation
        if (!item.designation) {
          tempErrors[`prevDesignation${i}`] = "Designation is required";
        } else if (item.designation.length < 2) {
          tempErrors[`prevDesignation${i}`] = "Designation must be at least 2 characters";
        }

        // Start date validation
        if (!item.start) {
          tempErrors[`prevStart${i}`] = "Start date is required";
        }

        // End date validation
        if (!item.end) {
          tempErrors[`prevEnd${i}`] = "End date is required";
        } else if (item.start && item.end) {
          const startDate = new Date(item.start);
          const endDate = new Date(item.end);
          if (endDate <= startDate) {
            tempErrors[`prevEnd${i}`] = "End date must be after start date";
          }
          const today = new Date();
          if (endDate > today) {
            tempErrors[`prevEnd${i}`] = "End date cannot be in the future";
          }
        }

        // Service letter validation
        if (!previousSubmitAtInterview[i] && !previousServiceLetters[i]) {
          tempErrors[`prevServiceLetter${i}`] = "Service letter is required";
        }
      });

    } else if (step === 3) {
      // CV validation
      if (!formData.cv) {
        tempErrors.cv = "CV is required";
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) setActiveStep(prev => prev + 1);
  };

  const handleBack = () => setActiveStep(prev => prev - 1);



  const formatDateForAPI = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;
    if (!hasRequiredExperience()) {
      alert("Not enough required experience.");
      return;
    }

    setSubmitting(true);
    const data = new FormData();
    const user_id = localStorage.getItem("user_id")
    data.append("user_id", user_id);
    data.append("job_id", id);
    data.append("title", formData.title);
    data.append("full_name", formData.fullName);
    data.append("lastname", formData.lastname);
    data.append("dob", formatDateForAPI(formData.dob));
    data.append("age", formData.age);
    data.append("nic", formData.nic);
    data.append("address", formData.address);
    data.append("phone", formData.phone);
    data.append("email", formData.email);
    data.append("marital_status", formData.maritalStatus);
    data.append("whatsapp_number", formData.whatsappNumber);
    data.append("cv", formData.cv);

    const presentEmploymentFormatted = {
      ...formData.presentEmployment,
      start: formatDateForAPI(formData.presentEmployment.start),
      end: formatDateForAPI(formData.presentEmployment.end)
    };

    const previousEmploymentsFormatted = formData.previousEmployment.map(emp => ({
      ...emp,
      start: formatDateForAPI(emp.start),
      end: formatDateForAPI(emp.end)
    }));

    data.append("present_employment", JSON.stringify(presentEmploymentFormatted));
    data.append("previous_employments", JSON.stringify(previousEmploymentsFormatted));
    data.append("present_service_letter", presentServiceLetter);


    data.append("submit_present_at_interview", submitAtInterview ? 1 : 0);
    data.append("submit_previous_at_interview", JSON.stringify(previousSubmitAtInterview));

    if (previousServiceLetters.length > 0) {
      data.append("previous_service_letter", previousServiceLetters[0]);
    }

    try {
      const res = await axios.post(`${API_BASE}/submit_application.php`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        alert("Application submitted successfully!");
        localStorage.setItem('application_ID', res.data.applicationId);
        navigate('/upload-requirements/' + id);
      } else alert(res.data?.message || "Submission failed.");
    } catch (err) {
      console.error(err);
      alert("Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };


  const handlePhoneChange = (field, value) => {
  // Remove non-numeric characters
  let cleaned = value.replace(/\D/g, "");

  // Limit to 10 digits
  if (cleaned.length > 10) {
    cleaned = cleaned.slice(0, 10);
  }

  setFormData((prev) => ({
    ...prev,
    [field]: cleaned,
  }));
};

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography
              variant="h6"
              sx={{ mb: 3, fontWeight: 600, color: "#2c3e50" }}
            >
              Personal Information
            </Typography>
            <Divider sx={{ mb: 4 }} />

            <Stack spacing={3}>
              <Box>
                <Typography
                  variant="body2"
                  sx={{ mb: 1, fontWeight: 500, color: "#555" }}
                >
                  Title <span style={{ color: "#d32f2f" }}>*</span>
                </Typography>
                <RoundedField
                  select
                  fullWidth
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  error={!!errors.title}
                  helperText={errors.title}
                  placeholder="Select title"
                >
                  <MenuItem value="Mr.">Mr.</MenuItem>
                  <MenuItem value="Mrs.">Mrs.</MenuItem>
                  <MenuItem value="Miss">Miss</MenuItem>
                  <MenuItem value="Dr.">Dr.</MenuItem>
                </RoundedField>
              </Box>

              <Box>
                <Typography
                  variant="body2"
                  sx={{ mb: 1, fontWeight: 500, color: "#555" }}
                >
                  Initials <span style={{ color: "#d32f2f" }}>*</span>
                </Typography>
                <RoundedField
                  fullWidth
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  error={!!errors.fullName}
                  helperText={errors.fullName}
                  placeholder="e.g., A.B.C."
                />
              </Box>

              <Box>
                <Typography
                  variant="body2"
                  sx={{ mb: 1, fontWeight: 500, color: "#555" }}
                >
                  Last Name <span style={{ color: "#d32f2f" }}>*</span>
                </Typography>
                <RoundedField
                  fullWidth
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleChange}
                  error={!!errors.lastname}
                  helperText={errors.lastname}
                  placeholder="Enter your last name"
                />
              </Box>

              <Box>
                <Typography
                  variant="body2"
                  sx={{ mb: 1, fontWeight: 500, color: "#555" }}
                >
                  Date of Birth <span style={{ color: "#d32f2f" }}>*</span>
                </Typography>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    value={formData.dob}
                    onChange={(newValue) => handleDateChange("dob", newValue)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.dob,
                        helperText: errors.dob,
                        sx: {
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            backgroundColor: "#ffffff",
                            "& fieldset": {
                              borderColor: "#e0e0e0",
                            },
                            "&:hover fieldset": {
                              borderColor: "#6c63ff",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "#6c63ff",
                              borderWidth: 2,
                            },
                          },
                          "& .MuiInputBase-input": {
                            padding: "12px 16px",
                          },
                        },
                      },
                    }}
                    maxDate={new Date()}
                    openTo="year"
                    views={["year", "month", "day"]}
                  />
                </LocalizationProvider>
              </Box>

              <Box>
                <Typography
                  variant="body2"
                  sx={{ mb: 1, fontWeight: 500, color: "#555" }}
                >
                  Age
                </Typography>
                <RoundedField
                  fullWidth
                  disabled
                  value={formData.age}
                  placeholder="Calculated automatically"
                />
              </Box>

              <Box>
                <Typography
                  variant="body2"
                  sx={{ mb: 1, fontWeight: 500, color: "#555" }}
                >
                  NIC <span style={{ color: "#d32f2f" }}>*</span>
                </Typography>
                <RoundedField
                  fullWidth
                  name="nic"
                  value={formData.nic}
                  onChange={handleChange}
                  error={!!errors.nic}
                  helperText={errors.nic}
                  placeholder="e.g., 123456789V or 200012345678"
                />
              </Box>

              <Box>
                <Typography
                  variant="body2"
                  sx={{ mb: 1, fontWeight: 500, color: "#555" }}
                >
                  Marital Status <span style={{ color: "#d32f2f" }}>*</span>
                </Typography>
                <RoundedField
                  select
                  fullWidth
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={handleChange}
                  error={!!errors.maritalStatus}
                  helperText={errors.maritalStatus}
                  placeholder="Select marital status"
                >
                  <MenuItem value="Married">Married</MenuItem>
                  <MenuItem value="Unmarried">Unmarried</MenuItem>
                </RoundedField>
              </Box>

              <Box>
                <Typography
                  variant="body2"
                  sx={{ mb: 1, fontWeight: 500, color: "#555" }}
                >
                  Address <span style={{ color: "#d32f2f" }}>*</span>
                </Typography>
                <RoundedField
                  fullWidth
                  multiline
                  rows={3}
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  error={!!errors.address}
                  helperText={errors.address}
                  placeholder="Enter your complete address"
                />
              </Box>

              <Box>
                <Typography
                  variant="body2"
                  sx={{ mb: 1, fontWeight: 500, color: "#555" }}
                >
                  Phone Number <span style={{ color: "#d32f2f" }}>*</span>
                </Typography>
                <RoundedField
                  fullWidth
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => handlePhoneChange("phone", e.target.value)}
                  maxLength={10}
                  error={!!errors.phone}
                  helperText={errors.phone}
                  placeholder="e.g., 0712345678"
                />
              </Box>

              <Box>
                <Typography
                  variant="body2"
                  sx={{ mb: 1, fontWeight: 500, color: "#555" }}
                >
                  WhatsApp Number <span style={{ color: "#d32f2f" }}>*</span>
                </Typography>
                <RoundedField
                  fullWidth
                  name="whatsappNumber"
                  value={formData.whatsappNumber}
                  onChange={(e) =>
                    handlePhoneChange("whatsappNumber", e.target.value)
                  }
                  maxLength={10}
                  error={!!errors.whatsappNumber}
                  helperText={errors.whatsappNumber}
                  placeholder="e.g., 0712345678"
                />
              </Box>

              <Box>
                <Typography
                  variant="body2"
                  sx={{ mb: 1, fontWeight: 500, color: "#555" }}
                >
                  Email Address <span style={{ color: "#d32f2f" }}>*</span>
                </Typography>

                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    mb: 1.5,
                    color: "#d32f2f",
                    fontWeight: 500,
                  }}
                >
                  Please enter the same email address that you used when logging in.
                </Typography>
                <RoundedField
                  fullWidth
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  placeholder="your.email@example.com"
                />
              </Box>
            </Stack>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#2c3e50' }}>
              Present Employment
            </Typography>
            <Divider sx={{ mb: 4 }} />

            <Stack spacing={3}>
              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#555' }}>
                  Organization <span style={{ color: '#d32f2f' }}>*</span>
                </Typography>
                <RoundedField
                  fullWidth
                  name="institute"
                  value={formData.presentEmployment.institute}
                  onChange={handlePresentChange}
                  error={!!errors.presentInstitute}
                  helperText={errors.presentInstitute}
                  placeholder="Current organization name"
                />
              </Box>

              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#555' }}>
                  Designation <span style={{ color: '#d32f2f' }}>*</span>
                </Typography>
                <RoundedField
                  fullWidth
                  name="designation"
                  value={formData.presentEmployment.designation}
                  onChange={handlePresentChange}
                  error={!!errors.presentDesignation}
                  helperText={errors.presentDesignation}
                  placeholder="Current job title"
                />
              </Box>

              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#555' }}>
                  Start Date <span style={{ color: '#d32f2f' }}>*</span>
                </Typography>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    value={formData.presentEmployment.start}
                    onChange={(newValue) => handlePresentDateChange('start', newValue)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.presentStart,
                        helperText: errors.presentStart,
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: '#ffffff',
                            '& fieldset': {
                              borderColor: '#e0e0e0',
                            },
                            '&:hover fieldset': {
                              borderColor: '#6c63ff',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#6c63ff',
                              borderWidth: 2,
                            },
                          },
                          '& .MuiInputBase-input': {
                            padding: '12px 16px',
                          },
                        }
                      }
                    }}
                    maxDate={new Date()}
                    openTo="year"
                    views={['year', 'month', 'day']}
                  />
                </LocalizationProvider>
              </Box>

              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#555' }}>
                  End Date
                </Typography>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    value={formData.presentEmployment.end}
                    disabled
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: '#f9fafb',
                            '& fieldset': {
                              borderColor: '#e0e0e0',
                            },
                          },
                          '& .MuiInputBase-input': {
                            padding: '12px 16px',
                          },
                        }
                      }
                    }}
                  />
                </LocalizationProvider>
              </Box>

              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#555' }}>
                  Duration
                </Typography>
                <RoundedField
                  fullWidth
                  disabled
                  value={formData.presentEmployment.duration}
                  placeholder="Calculated automatically"
                />
              </Box>

            <FormControlLabel
              control={
                <Checkbox
                  checked={submitAtInterview}
                  //onChange={(e) => setSubmitAtInterview(e.target.checked)}
                  onChange={(e) => {
                  setSubmitAtInterview(e.target.checked);

              // Clear error when user selects checkbox
              setErrors((prev) => ({
                ...prev,
                presentServiceLetter: "",
              }));
            }}

      sx={{
        color: "#6c63ff",
        "&.Mui-checked": { color: "#6c63ff" },
      }}
    />
  }
  label="Submit at interview"
/>

{/* Optional helper text */}
{submitAtInterview && (
  <Typography sx={{ mt: 1, color: "#f59e0b", fontSize: "0.85rem" }}>
    You can submit the service letter during the interview.
  </Typography>
)}


{!submitAtInterview && (
  <Box>
    <Typography
      variant="body2"
      sx={{ mb: 1, fontWeight: 500, color: "#555" }}
    >
      Service Letter <span style={{ color: "#d32f2f" }}>*</span>
    </Typography>

    <FileUploadButton
      component="label"
      startIcon={<UploadFileIcon />}
      fullWidth
    >
      {presentServiceLetter ? "Change File" : "Upload Service Letter"}

      <input
        hidden
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={(e) =>
          handleServiceLetterChange(e.target.files[0], "present")
        }
      />
    </FileUploadButton>

    {/* File Preview */}
    {presentServiceLetter && (
      <Box
        sx={{
          mt: 2,
          p: 2,
          backgroundColor: "#f0fdf4",
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <CheckCircleIcon sx={{ color: "#10b981", fontSize: 20 }} />
        <Typography
          variant="body2"
          sx={{ color: "#059669", fontWeight: 500 }}
        >
          {presentServiceLetter.name}
        </Typography>
      </Box>
    )}

          {/* Error */}
          {errors.presentServiceLetter && (
            <Typography
              variant="caption"
              sx={{ color: "#d32f2f", mt: 1, display: "block" }}
            >
              {errors.presentServiceLetter}
            </Typography>
          )}
        </Box>
      )}
            </Stack>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#2c3e50' }}>
              Previous Employment History
            </Typography>
            <Divider sx={{ mb: 4 }} />

            <Stack spacing={4}>
              {formData.previousEmployment.map((item, i) => (
                <Paper
                  key={i}
                  elevation={0}
                  sx={{
                    p: 3,
                    border: '1px solid #e5e7eb',
                    borderRadius: 2,
                    backgroundColor: '#fafafa'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#6c63ff' }}>
                      Employment #{i + 1}
                    </Typography>
                    <IconButton
                      color="error"
                      onClick={() => removePrevious(i)}
                      size="small"
                      sx={{
                        '&:hover': {
                          backgroundColor: '#fee2e2'
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>

                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#555' }}>
                        Organization <span style={{ color: '#d32f2f' }}>*</span>
                      </Typography>
                      <RoundedField
                        fullWidth
                        name="institute"
                        value={item.institute}
                        onChange={(e) => handlePreviousChange(i, e)}
                        error={!!errors[`prevInstitute${i}`]}
                        helperText={errors[`prevInstitute${i}`]}
                        placeholder="Previous organization name"
                      />
                    </Box>

                    <Box>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#555' }}>
                        Designation <span style={{ color: '#d32f2f' }}>*</span>
                      </Typography>
                      <RoundedField
                        fullWidth
                        name="designation"
                        value={item.designation}
                        onChange={(e) => handlePreviousChange(i, e)}
                        error={!!errors[`prevDesignation${i}`]}
                        helperText={errors[`prevDesignation${i}`]}
                        placeholder="Previous job title"
                      />
                    </Box>

                    <Box>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#555' }}>
                        Start Date <span style={{ color: '#d32f2f' }}>*</span>
                      </Typography>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          value={item.start}
                          onChange={(newValue) => handlePreviousDateChange(i, 'start', newValue)}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              error: !!errors[`prevStart${i}`],
                              helperText: errors[`prevStart${i}`],
                              sx: {
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
                                  backgroundColor: '#ffffff',
                                  '& fieldset': {
                                    borderColor: '#e0e0e0',
                                  },
                                  '&:hover fieldset': {
                                    borderColor: '#6c63ff',
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: '#6c63ff',
                                    borderWidth: 2,
                                  },
                                },
                                '& .MuiInputBase-input': {
                                  padding: '12px 16px',
                                },
                              }
                            }
                          }}
                          maxDate={new Date()}
                          openTo="year"
                          views={['year', 'month', 'day']}
                        />
                      </LocalizationProvider>
                    </Box>

                    <Box>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#555' }}>
                        End Date <span style={{ color: '#d32f2f' }}>*</span>
                      </Typography>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          value={item.end}
                          onChange={(newValue) => handlePreviousDateChange(i, 'end', newValue)}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              error: !!errors[`prevEnd${i}`],
                              helperText: errors[`prevEnd${i}`],
                              sx: {
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
                                  backgroundColor: '#ffffff',
                                  '& fieldset': {
                                    borderColor: '#e0e0e0',
                                  },
                                  '&:hover fieldset': {
                                    borderColor: '#6c63ff',
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: '#6c63ff',
                                    borderWidth: 2,
                                  },
                                },
                                '& .MuiInputBase-input': {
                                  padding: '12px 16px',
                                },
                              }
                            }
                          }}
                          maxDate={new Date()}
                          openTo="year"
                          views={['year', 'month', 'day']}
                        />
                      </LocalizationProvider>
                    </Box>

                    <Box>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#555' }}>
                        Duration
                      </Typography>
                      <RoundedField
                        fullWidth
                        disabled
                        value={item.duration}
                        placeholder="Calculated automatically"
                      />
                    </Box>

                    <FormControlLabel
  control={
    <Checkbox
      checked={previousSubmitAtInterview[i] || false}
      onChange={(e) => {
        const updated = [...previousSubmitAtInterview];
        updated[i] = e.target.checked;
        setPreviousSubmitAtInterview(updated);

        // Clear error
        setErrors(prev => ({
          ...prev,
          [`prevServiceLetter${i}`]: ""
        }));
      }}
      sx={{
        color: "#6c63ff",
        "&.Mui-checked": { color: "#6c63ff" },
      }}
    />
  }
  label="Submit at interview"
/>

{previousSubmitAtInterview[i] && (
  <Typography sx={{ mt: 1, color: "#f59e0b", fontSize: "0.85rem" }}>
    You can submit the service letter during the interview.
  </Typography>
)}

{!previousSubmitAtInterview[i] && (
  <Box>
    <Typography
      variant="body2"
      sx={{ mb: 1, fontWeight: 500, color: "#555" }}
    >
      Service Letter <span style={{ color: "#d32f2f" }}>*</span>
    </Typography>

    <FileUploadButton
      component="label"
      startIcon={<UploadFileIcon />}
      fullWidth
    >
      {previousServiceLetters[i] ? "Change File" : "Upload Service Letter"}

      <input
        hidden
        type="file"
        accept=".pdf,.doc,.docx"
/*         onChange={(e) =>
          //handleServiceLetterChange(e.target.files[0], "previous", i)
        } */
        onChange={(e) =>
        handleServiceLetterChange(e.target.files[0], "previous", i)
    }
      />
    </FileUploadButton>

    {previousServiceLetters[i] && (
      <Box
        sx={{
          mt: 2,
          p: 2,
          backgroundColor: "#f0fdf4",
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <CheckCircleIcon sx={{ color: "#10b981", fontSize: 20 }} />
        <Typography
          variant="body2"
          sx={{ color: "#059669", fontWeight: 500 }}
        >
          {previousServiceLetters[i].name}
        </Typography>
      </Box>
    )}

    {errors[`prevServiceLetter${i}`] && (
      <Typography
        variant="caption"
        sx={{ color: "#d32f2f", mt: 1, display: "block" }}
      >
        {errors[`prevServiceLetter${i}`]}
      </Typography>
    )}
  </Box>
)}
                  </Stack>
                </Paper>
              ))}

              <StyledButton
                variant="outlined"
                startIcon={<AddCircleOutlineIcon />}
                onClick={addPrevious}
                sx={{
                  borderColor: '#6c63ff',
                  color: '#6c63ff',
                  '&:hover': {
                    borderColor: '#5548e0',
                    backgroundColor: '#f8f7ff'
                  }
                }}
              >
                Add Previous Employment
              </StyledButton>
            </Stack>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#2c3e50' }}>
              Upload Your CV
            </Typography>
            <Divider sx={{ mb: 4 }} />

            <Box sx={{ textAlign: 'center', py: 4 }}>
              <FileUploadButton
                component="label"
                startIcon={<UploadFileIcon />}
                sx={{ px: 4, py: 1.5 }}
              >
                {cvFile ? 'Change CV File' : 'Select CV File'}
                <input
                  hidden
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleCVChange}
                />
              </FileUploadButton>

              {cvFile && (
                <Box sx={{ mt: 3, p: 3, backgroundColor: '#f0fdf4', borderRadius: 2, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircleIcon sx={{ color: '#10b981', fontSize: 24 }} />
                  <Typography variant="body1" sx={{ color: '#059669', fontWeight: 500 }}>
                    {cvFile.name}
                  </Typography>
                </Box>
              )}

              {errors.cv && (
                <Typography variant="body2" sx={{ color: '#d32f2f', mt: 2 }}>
                  {errors.cv}
                </Typography>
              )}

              <Typography variant="caption" sx={{ display: 'block', mt: 3, color: '#6b7280' }}>
                Accepted formats: PDF, DOC, DOCX (Max size: 5MB)
              </Typography>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 3,
          border: '1px solid #e5e7eb',
          backgroundColor: '#ffffff'
        }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1f2937', mb: 1 }}>
            Job Application
          </Typography>
          <Typography variant="body1" sx={{ color: '#6b7280' }}>
            {job?.title || 'Loading...'}
          </Typography>
        </Box>

        <Stepper
          activeStep={activeStep}
          alternativeLabel
          sx={{
            mb: 5,
            '& .MuiStepLabel-label': {
              fontSize: '0.875rem',
              fontWeight: 500
            },
            '& .MuiStepLabel-label.Mui-active': {
              color: '#6c63ff',
              fontWeight: 600
            },
            '& .MuiStepIcon-root.Mui-active': {
              color: '#6c63ff'
            },
            '& .MuiStepIcon-root.Mui-completed': {
              color: '#10b981'
            }
          }}
        >
          {steps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ minHeight: '400px' }}>
          {renderStepContent()}
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <StyledButton
            disabled={activeStep === 0}
            onClick={handleBack}
            variant="outlined"
            sx={{
              borderColor: '#e5e7eb',
              color: '#6b7280',
              '&:hover': {
                borderColor: '#d1d5db',
                backgroundColor: '#f9fafb'
              },
              '&:disabled': {
                borderColor: '#f3f4f6',
                color: '#d1d5db'
              }
            }}
          >
            Back
          </StyledButton>

          {activeStep === steps.length - 1 ? (
            <StyledButton
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting}
              sx={{
                backgroundColor: '#6c63ff',
                '&:hover': {
                  backgroundColor: '#5548e0'
                },
                '&:disabled': {
                  backgroundColor: '#e5e7eb',
                  color: '#9ca3af'
                }
              }}
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </StyledButton>
          ) : (
            <StyledButton
              variant="contained"
              onClick={handleNext}
              sx={{
                backgroundColor: '#6c63ff',
                '&:hover': {
                  backgroundColor: '#5548e0'
                }
              }}
            >
              Next
            </StyledButton>
          )}
        </Box>
      </Paper>
    </Container>
  );
}
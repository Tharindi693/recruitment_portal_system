import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

// Auth pages
import Register from './components/Auth/Register';
import Login from './components/Auth/Login';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';

// Applicant pages
import JobList from './components/Applicant/JobList';
import ApplyForm from './components/Applicant/ApplyForm';
import UploadRequirements from './components/Applicant/UploadRequirements';
import Findjobs from './components/Applicant/Findjobs';

// Admin pages
import JobManagement from './components/Admin/JobManagement';
import ApplicantsView from './components/Admin/ApplicantsView';
import WP2DataGridUpload from './components/Admin/WP2DataGrid';
import AdminDashboard from './components/Admin/AdminDashboard';

function App() {
  return (
    <Router basename="/recruitment">
      <Routes>

        {/* Default route */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Applicant */}
        <Route path="/jobs" element={<JobList />} />
        <Route path="/findjobs" element={<Findjobs />} />
        <Route path="/apply/:id" element={<ApplyForm />} />
        <Route path="/upload-requirements/:jobId" element={<UploadRequirements />} />

        {/* Admin */}
        <Route path="/admindashboard" element={<AdminDashboard />} />
        <Route path="/manage-jobs" element={<JobManagement />} />
        <Route path="/applicants" element={<ApplicantsView />} />
        <Route path="/excel" element={<WP2DataGridUpload />} />

      </Routes>
    </Router>
  );
}

export default App;
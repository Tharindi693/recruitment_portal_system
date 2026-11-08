import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Findjobs = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // loading state
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');

    // Only parse if storedUser exists and is not "undefined"
    if (storedUser && storedUser !== 'undefined') {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error('Invalid JSON in localStorage for user:', storedUser);
        localStorage.removeItem('user'); // remove invalid data
        navigate('/login'); // redirect to login
      }
    } else {
      // No user stored, or stored value is "undefined"
      navigate('/login');
    }

    setLoading(false);
  }, [navigate]);

  if (loading) return <p>Loading...</p>; // show spinner while checking
  if (!user) return null; // safety fallback

  return (
    <div>
      <h1>Welcome {user.username}!</h1>

      {/* Jobs list example */}
      <JobList />
    </div>
  );
};

// Example component to fetch jobs
const JobList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Replace with your API endpoint
    fetch('/api/jobs')
      .then(res => res.json())
      .then(data => setJobs(data))
      .catch(err => console.error('Error fetching jobs:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading jobs...</p>;
  if (!jobs.length) return <p>No jobs found.</p>;

  return (
    <ul>
      {jobs.map(job => (
        <li key={job.id}>{job.title}</li>
      ))}
    </ul>
  );
};

export default Findjobs;

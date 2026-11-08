import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function VerifyEmail() {
  const { code } = useParams();
  const [msg, setMsg] = useState('Verifying...');

  useEffect(() => {
    fetch(`https://cecb.lk/backend/api/auth.php?action=verify&code=${code}`)
      .then(res => res.json())
      .then(data => setMsg(data.message))
      .catch(() => setMsg('Something went wrong.'));
  }, [code]);

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Email Verification</h2>
      <p>{msg}</p>
    </div>
  );
}
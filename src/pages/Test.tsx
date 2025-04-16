import { useContext } from 'react';
import AuthContext from '@/contexts/auth/authContext';
import { useNavigate } from 'react-router';

export default function Test() {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  console.log(`User in test: ${auth?.myUser?.displayName}`);

  return (
    <div>
      <h1>Test Page</h1>
      <button onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
    </div>
  );
}

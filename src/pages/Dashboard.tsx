import { useContext } from 'react';
import AuthContext from '@/contexts/auth/authContext';
import { useNavigate } from 'react-router';

export default function Dashboard() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  console.log(`User in dashboard: ${auth?.myUser?.displayName}`);

  if (!auth || !auth.firebaseUser) return null;

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {auth.myUser?.displayName}</p>
      <button onClick={auth.signOut}>Sign Out</button>
      <button onClick={() => navigate('/test')}>Test</button>
    </div>
  );
}

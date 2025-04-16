import { useContext } from 'react';
import AuthContext from '../contexts/auth/authContext';

export default function Dashboard() {
  const auth = useContext(AuthContext);
  console.log(auth);

  if (!auth || !auth.firebaseUser) return null;

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {auth.firebaseUser.email}</p>
      <button onClick={auth.signOut}>Sign Out</button>
    </div>
  );
}

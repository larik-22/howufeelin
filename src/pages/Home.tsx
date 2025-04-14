import { useContext } from "react";
import { Link } from "react-router";
import AuthContext from "../contexts/auth/authContext";

export default function Home() {
    const auth = useContext(AuthContext);

    if (!auth) return null;

    return (
        <div>
            <h1>Welcome to HowUFeel</h1>
            {auth.user ? (
                <Link to="/dashboard">Go to Dashboard</Link>
            ) : (
                <Link to="/login">Login</Link>
            )}
        </div>
    );
} 
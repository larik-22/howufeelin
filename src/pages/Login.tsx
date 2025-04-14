import { useContext, useState } from "react";
import AuthContext from "../contexts/auth/authContext";

export default function Login() {
    const auth = useContext(AuthContext);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    if (!auth) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await auth.signInWithEmail(email, password);
    };

    return (
        <div>
            <h1>Login</h1>
            {auth.error && <div style={{ color: "red" }}>{auth.error}</div>}
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                />
                <button type="submit" disabled={auth.loading}>
                    {auth.loading ? "Loading..." : "Login"}
                </button>
            </form>
            <button onClick={auth.signInWithGoogle} disabled={auth.loading}>
                Sign in with Google
            </button>
        </div>
    );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await api.post("auth/login/", {
                username: username,
                password: password,
            });

            localStorage.setItem("access", response.data.access);
            localStorage.setItem("refresh", response.data.refresh);

            alert("Login successful!");

            navigate("/dashboard");
        } catch (error) {
            console.log("LOGIN ERROR:", error);
            console.log("RESPONSE:", error.response);
            console.log("DATA:", error.response?.data);

            alert(
                error.response?.data?.detail ||
                "Login failed. Check browser console."
            );
        }
    };

    return (
        <div>
            <h2>VeriLearn Login</h2>

            <form onSubmit={handleLogin}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />

                <br />
                <br />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <br />
                <br />

                <button type="submit">Login</button>
            </form>
        </div>
    );
}

export default Login;
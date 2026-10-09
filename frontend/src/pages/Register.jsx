import { useState } from "react";
import api from "../services/api";

function Register() {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
    });

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        try {
            const response = await api.post(
                "auth/register/",
                formData
            );

            setMessage(response.data.message);

            setFormData({
                username: "",
                email: "",
                password: "",
            });
        } catch (error) {
            if (error.response) {
                setError(JSON.stringify(error.response.data));
            } else {
                setError("Something went wrong.");
            }
        }
    };

    return (
        <div>
            <h1>VeriLearn</h1>
            <h2>Create Account</h2>

            <form onSubmit={handleSubmit}>

                <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                />

                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />

                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />

                <button type="submit">
                    Create Account
                </button>

            </form>

            {message && (
                <p>{message}</p>
            )}

            {error && (
                <p>{error}</p>
            )}
        </div>
    );
}

export default Register;
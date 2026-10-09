import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function CreateTask() {
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [taskDate, setTaskDate] = useState("");
    const [estimatedMinutes, setEstimatedMinutes] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem("access");

            const response = await api.post(
                "tasks/",
                {
                    title: title,
                    description: description,
                    task_date: taskDate,
                    estimated_minutes: Number(estimatedMinutes),
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            console.log("TASK CREATED:", response.data);

            alert("Task created successfully!");

            navigate("/dashboard");

        } catch (error) {
            console.log("TASK CREATION ERROR:", error);
            console.log("RESPONSE:", error.response?.data);

            alert(
                error.response?.data?.detail ||
                "Failed to create task."
            );
        }
    };

    return (
        <div style={styles.container}>

            <div style={styles.formContainer}>

                <h1>Create New Task</h1>

                <p style={styles.subtitle}>
                    Define what you want to accomplish today.
                </p>

                <form onSubmit={handleSubmit}>

                    <label style={styles.label}>
                        Task Title
                    </label>

                    <input
                        style={styles.input}
                        type="text"
                        placeholder="Example: DBMS Normalization"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />

                    <label style={styles.label}>
                        What do you want to accomplish?
                    </label>

                    <textarea
                        style={styles.textarea}
                        placeholder="Describe what you want to complete..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />

                    <label style={styles.label}>
                        Task Date
                    </label>

                    <input
                        style={styles.input}
                        type="date"
                        value={taskDate}
                        onChange={(e) => setTaskDate(e.target.value)}
                        required
                    />

                    <label style={styles.label}>
                        Estimated Time (minutes)
                    </label>

                    <input
                        style={styles.input}
                        type="number"
                        min="1"
                        placeholder="Example: 60"
                        value={estimatedMinutes}
                        onChange={(e) =>
                            setEstimatedMinutes(e.target.value)
                        }
                        required
                    />

                    <button
                        style={styles.button}
                        type="submit"
                    >
                        Create Task
                    </button>

                </form>

            </div>

        </div>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        backgroundColor: "#111318",
        color: "#ffffff",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, sans-serif",
        padding: "30px",
    },

    formContainer: {
        width: "100%",
        maxWidth: "600px",
        backgroundColor: "#1c1f26",
        padding: "35px",
        borderRadius: "14px",
        border: "1px solid #30343d",
    },

    subtitle: {
        color: "#aaa",
        marginBottom: "30px",
    },

    label: {
        display: "block",
        marginTop: "18px",
        marginBottom: "8px",
        fontSize: "14px",
    },

    input: {
        width: "100%",
        padding: "12px",
        borderRadius: "6px",
        border: "1px solid #444",
        backgroundColor: "#252830",
        color: "#ffffff",
        boxSizing: "border-box",
    },

    textarea: {
        width: "100%",
        minHeight: "120px",
        padding: "12px",
        borderRadius: "6px",
        border: "1px solid #444",
        backgroundColor: "#252830",
        color: "#ffffff",
        resize: "vertical",
        boxSizing: "border-box",
        fontFamily: "Arial, sans-serif",
    },

    button: {
        width: "100%",
        marginTop: "25px",
        padding: "12px",
        border: "none",
        borderRadius: "7px",
        backgroundColor: "#6c63ff",
        color: "#ffffff",
        fontSize: "16px",
        cursor: "pointer",
    },
};

export default CreateTask;
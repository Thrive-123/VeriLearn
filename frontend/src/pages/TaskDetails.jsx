
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

const BACKEND_URL = "http://127.0.0.1:8000";

function getEvidenceUrl(fileValue) {
    if (!fileValue) return "";

    if (fileValue.startsWith("http://") || fileValue.startsWith("https://")) {
        return fileValue;
    }

    return `${BACKEND_URL}${fileValue.startsWith("/") ? "" : "/"}${fileValue}`;
}

function TaskDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [task, setTask] = useState(null);
    const [evidence, setEvidence] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const loadData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [taskResponse, evidenceResponse] = await Promise.all([
                api.get(`tasks/${id}/`),
                api.get(`evidence/task/${id}/`),
            ]);

            setTask(taskResponse.data);

            const evidenceData = evidenceResponse.data;
            setEvidence(
                Array.isArray(evidenceData)
                    ? evidenceData
                    : evidenceData.results || []
            );
        } catch (err) {
            console.error("Failed to load task:", err);
            setError(
                err.response?.status === 401
                    ? "Session expired. Please log in again."
                    : "Could not load task details. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleFileChange = (event) => {
        setSelectedFiles(Array.from(event.target.files || []));
        setError("");
        setMessage("");
    };

    const handleUpload = async (event) => {
        event.preventDefault();

        if (selectedFiles.length === 0) {
            setError("Please select at least one file.");
            return;
        }

        setUploading(true);
        setError("");
        setMessage("");

        try {
            for (const file of selectedFiles) {
                const formData = new FormData();

                formData.append("task", String(id));
                formData.append("file", file);

                // Do not manually set Content-Type.
                // Axios/browser will set multipart/form-data
                // with the required boundary.
                await api.post("evidence/", formData);
            }

            setMessage(
                "Evidence uploaded successfully. AI verification has been processed."
            );
            setSelectedFiles([]);

            const fileInput = document.getElementById("evidence-files");
            if (fileInput) {
                fileInput.value = "";
            }

            await loadData();
        } catch (err) {
            console.error("Evidence upload failed:", err);

            if (err.response?.status === 401) {
                setError("Your session expired. Please log in again.");
            } else if (err.response?.data) {
                setError(
                    typeof err.response.data === "string"
                        ? err.response.data
                        : JSON.stringify(err.response.data)
                );
            } else {
                setError(
                    "Upload failed. Check that the backend is running and try again."
                );
            }
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div style={styles.page}>
                <p>Loading task details...</p>
            </div>
        );
    }

    if (!task) {
        return (
            <div style={styles.page}>
                <button style={styles.secondaryButton} onClick={() => navigate("/dashboard")}>
                    ← Dashboard
                </button>
                <p style={styles.error}>{error || "Task not found."}</p>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <button
                    style={styles.secondaryButton}
                    onClick={() => navigate("/dashboard")}
                >
                    ← Dashboard
                </button>

                <h1>{task.title}</h1>
                <p style={styles.description}>{task.description}</p>

                <div style={styles.card}>
                    <div style={styles.stats}>
                        <div>
                            <small>Task Date</small>
                            <p>{task.task_date}</p>
                        </div>

                        <div>
                            <small>Estimated Time</small>
                            <p>{task.estimated_minutes} minutes</p>
                        </div>

                        <div>
                            <small>Completion</small>
                            <p>{task.completion_percentage ?? 0}%</p>
                        </div>
                    </div>

                    <div style={styles.progressBackground}>
                        <div
                            style={{
                                ...styles.progress,
                                width: `${Math.max(
                                    0,
                                    Math.min(100, task.completion_percentage ?? 0)
                                )}%`,
                            }}
                        />
                    </div>
                </div>

                <div style={styles.card}>
                    <h2>📎 Submit Your Evidence</h2>
                    <p style={styles.muted}>
                        Upload your notes, solutions, screenshots, PDFs, or other
                        evidence of your work.
                    </p>

                    <form onSubmit={handleUpload}>
                        <input
                            id="evidence-files"
                            type="file"
                            accept="image/*,.pdf,.txt,.doc,.docx"
                            multiple
                            onChange={handleFileChange}
                            style={styles.fileInput}
                        />

                        {selectedFiles.length > 0 && (
                            <div style={styles.selectedFiles}>
                                <h3>Selected Files</h3>
                                {selectedFiles.map((file, index) => (
                                    <p key={`${file.name}-${index}`}>
                                        📄 {file.name}
                                    </p>
                                ))}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={uploading || selectedFiles.length === 0}
                            style={{
                                ...styles.primaryButton,
                                opacity:
                                    uploading || selectedFiles.length === 0
                                        ? 0.6
                                        : 1,
                            }}
                        >
                            {uploading ? "Uploading..." : "Upload Evidence"}
                        </button>
                    </form>

                    {error && <p style={styles.error}>{error}</p>}
                    {message && <p style={styles.success}>{message}</p>}
                </div>

                {task.ai_feedback && (
                    <div style={styles.card}>
                        <h2>🤖 Latest AI Feedback</h2>
                        <pre style={styles.feedback}>{task.ai_feedback}</pre>
                    </div>
                )}

                <div style={styles.card}>
                    <h2>📚 Evidence History</h2>

                    {evidence.length === 0 ? (
                        <p style={styles.muted}>No evidence uploaded yet.</p>
                    ) : (
                        evidence.map((item) => (
                            <div key={item.id} style={styles.evidenceCard}>
                                <div style={styles.evidenceHeader}>
                                    <strong>Submission {item.id}</strong>
                                    <span style={styles.status}>
                                        {item.status}
                                    </span>
                                </div>

                                <p>
                                    Completion: {item.completion_percentage}%
                                </p>

                                {item.ai_feedback && (
                                    <pre style={styles.feedback}>
                                        {item.ai_feedback}
                                    </pre>
                                )}

                                {item.file && (
                                    <a
                                        href={getEvidenceUrl(item.file)}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={styles.link}
                                    >
                                        📷 View Image / Open File ↗
                                    </a>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#111318",
        color: "#f4f4f5",
        padding: "24px 16px",
        boxSizing: "border-box",
        fontFamily: "Arial, sans-serif",
    },
    container: {
        maxWidth: "900px",
        margin: "0 auto",
    },
    card: {
        background: "#191c23",
        border: "1px solid #30343f",
        borderRadius: "10px",
        padding: "22px",
        marginTop: "20px",
    },
    description: {
        color: "#c5c8d0",
        lineHeight: 1.6,
    },
    muted: {
        color: "#b3b7c2",
        lineHeight: 1.6,
    },
    stats: {
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        gap: "16px",
    },
    progressBackground: {
        height: "8px",
        background: "#343846",
        borderRadius: "20px",
        overflow: "hidden",
        marginTop: "16px",
    },
    progress: {
        height: "100%",
        background: "#7764ef",
        borderRadius: "20px",
    },
    fileInput: {
        display: "block",
        width: "100%",
        margin: "20px 0",
        color: "#f4f4f5",
    },
    selectedFiles: {
        background: "#242731",
        borderRadius: "8px",
        padding: "12px",
        marginBottom: "16px",
        overflowWrap: "anywhere",
    },
    primaryButton: {
        background: "#6654db",
        color: "white",
        border: "none",
        borderRadius: "7px",
        padding: "12px 20px",
        cursor: "pointer",
        fontWeight: "bold",
    },
    secondaryButton: {
        background: "#292d36",
        color: "white",
        border: "1px solid #414653",
        borderRadius: "7px",
        padding: "10px 14px",
        cursor: "pointer",
    },
    error: {
        color: "#ff8585",
        overflowWrap: "anywhere",
    },
    success: {
        color: "#72e5a0",
        overflowWrap: "anywhere",
    },
    feedback: {
        whiteSpace: "pre-wrap",
        overflowWrap: "anywhere",
        fontFamily: "inherit",
        color: "#d4d7e0",
        lineHeight: 1.6,
    },
    evidenceCard: {
        background: "#222630",
        borderRadius: "8px",
        padding: "16px",
        marginTop: "14px",
        overflowWrap: "anywhere",
    },
    evidenceHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "10px",
    },
    status: {
        background: "#343849",
        borderRadius: "20px",
        padding: "5px 10px",
        fontSize: "12px",
    },
    link: {
        display: "inline-block",
        marginTop: "10px",
        color: "#b4a7ff",
        textDecoration: "none",
    },
};

export default TaskDetails;

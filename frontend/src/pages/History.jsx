
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function History() {
    const navigate = useNavigate();

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem("access");

            if (!token) {
                navigate("/");
                return;
            }

            const response = await api.get("tasks/", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setTasks(
                Array.isArray(response.data)
                    ? response.data
                    : response.data.results || []
            );
        } catch (error) {
            console.log("HISTORY ERROR:", error);
            console.log("RESPONSE:", error.response?.data);

            if (error.response?.status === 401) {
                localStorage.removeItem("access");
                localStorage.removeItem("refresh");
                navigate("/");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    if (loading) {
        return (
            <div style={styles.loading}>
                Loading Learning History...
            </div>
        );
    }

    const filteredTasks = tasks.filter((task) => {
        const search = searchTerm.trim().toLowerCase();

        const title = (task.title || "").toLowerCase();
        const description = (task.description || "").toLowerCase();

        const matchesSearch =
            title.includes(search) ||
            description.includes(search);

        const matchesStatus =
            statusFilter === "all" ||
            task.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const groupedTasks = filteredTasks.reduce((groups, task) => {
        const date = task.task_date;

        if (!groups[date]) {
            groups[date] = [];
        }

        groups[date].push(task);

        return groups;
    }, {});

    const dates = Object.keys(groupedTasks).sort((a, b) =>
        b.localeCompare(a)
    );

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <div>
                    <h1 style={styles.logo}>
                        📚 Learning History
                    </h1>

                    <p style={styles.subtitle}>
                        Revisit everything you have learned.
                    </p>
                </div>

                <button
                    style={styles.backButton}
                    onClick={() => navigate("/dashboard")}
                >
                    ← Dashboard
                </button>
            </div>

            <div style={styles.filterBar}>
                <input
                    type="text"
                    placeholder="🔍 Search tasks by title or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={styles.searchInput}
                    aria-label="Search learning history"
                />

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={styles.statusSelect}
                    aria-label="Filter tasks by status"
                >
                    <option value="all">All Tasks</option>
                    <option value="completed">Completed</option>
                    <option value="partial">Partial</option>
                    <option value="pending">Pending</option>
                </select>

                <button
                    style={styles.clearButton}
                    onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("all");
                    }}
                >
                    Clear
                </button>
            </div>

            <div style={styles.resultsText}>
                Showing {filteredTasks.length} of {tasks.length} tasks
            </div>

            {tasks.length === 0 ? (
                <div style={styles.emptyCard}>
                    <h2>No learning history yet.</h2>
                    <p>
                        Complete your first task to start building
                        your learning history.
                    </p>
                </div>
            ) : dates.length === 0 ? (
                <div style={styles.emptyCard}>
                    <h2>No matching tasks found.</h2>
                    <p>
                        Try another search term or select a different
                        status filter.
                    </p>
                </div>
            ) : (
                <div>
                    {dates.map((date) => (
                        <div key={date} style={styles.daySection}>
                            <div style={styles.dateHeader}>
                                <h2 style={styles.dateTitle}>
                                    {formatDate(date)}
                                </h2>

                                <span style={styles.taskCount}>
                                    {groupedTasks[date].length}{" "}
                                    {groupedTasks[date].length === 1
                                        ? "task"
                                        : "tasks"}
                                </span>
                            </div>

                            <div style={styles.taskList}>
                                {groupedTasks[date].map((task) => (
                                    <div
                                        key={task.id}
                                        style={styles.taskCard}
                                        onClick={() =>
                                            navigate(`/task/${task.id}`)
                                        }
                                    >
                                        <div style={styles.taskHeader}>
                                            <div style={styles.taskMain}>
                                                <h3 style={styles.taskTitle}>
                                                    {task.title}
                                                </h3>

                                                <p style={styles.taskDescription}>
                                                    {task.description}
                                                </p>
                                            </div>

                                            <span
                                                style={{
                                                    ...styles.status,
                                                    ...(task.status === "completed"
                                                        ? styles.completed
                                                        : task.status === "partial"
                                                        ? styles.partial
                                                        : styles.pending),
                                                }}
                                            >
                                                {task.status || "pending"}
                                            </span>
                                        </div>

                                        <div style={styles.taskInfo}>
                                            <span>
                                                Completion:{" "}
                                                <strong>
                                                    {task.completion_percentage || 0}%
                                                </strong>
                                            </span>

                                            <span>
                                                ⏱️ {task.estimated_minutes} min
                                            </span>

                                            <span style={styles.viewText}>
                                                View Evidence →
                                            </span>
                                        </div>

                                        <div style={styles.progressBackground}>
                                            <div
                                                style={{
                                                    ...styles.progress,
                                                    width: `${Math.min(
                                                        100,
                                                        Math.max(
                                                            0,
                                                            Number(
                                                                task.completion_percentage
                                                            ) || 0
                                                        )
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function formatDate(dateString) {
    const date = new Date(`${dateString}T00:00:00`);

    return date.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

const styles = {
    page: {
        minHeight: "100vh",
        padding: "30px",
        background: "#0f1117",
        color: "#f5f5f5",
        fontFamily: "Arial, sans-serif",
    },

    loading: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f1117",
        color: "#ffffff",
        fontFamily: "Arial, sans-serif",
    },

    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "15px",
        background: "#171a21",
        border: "1px solid #292d38",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "20px",
    },

    logo: {
        margin: 0,
        fontSize: "26px",
        color: "#ffffff",
    },

    subtitle: {
        color: "#9ca3af",
        fontSize: "13px",
        marginTop: "6px",
        marginBottom: 0,
    },

    backButton: {
        padding: "10px 16px",
        background: "#6c63ff",
        color: "#ffffff",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "600",
    },

    filterBar: {
        display: "flex",
        gap: "12px",
        marginBottom: "12px",
        flexWrap: "wrap",
    },

    searchInput: {
        flex: 1,
        minWidth: "220px",
        padding: "13px",
        background: "#1b1f27",
        color: "#ffffff",
        border: "1px solid #303541",
        borderRadius: "8px",
        outline: "none",
        fontSize: "14px",
        boxSizing: "border-box",
    },

    statusSelect: {
        minWidth: "150px",
        padding: "13px",
        background: "#1b1f27",
        color: "#ffffff",
        border: "1px solid #303541",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "14px",
    },

    clearButton: {
        padding: "12px 16px",
        background: "#303541",
        color: "#ffffff",
        border: "1px solid #414653",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "600",
    },

    resultsText: {
        color: "#9ca3af",
        fontSize: "12px",
        marginBottom: "25px",
    },

    daySection: {
        marginBottom: "30px",
    },

    dateHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        marginBottom: "12px",
    },

    dateTitle: {
        margin: 0,
        color: "#ffffff",
        fontSize: "20px",
    },

    taskCount: {
        color: "#9ca3af",
        fontSize: "13px",
    },

    taskList: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },

    taskCard: {
        background: "#1b1f27",
        border: "1px solid #303541",
        borderRadius: "10px",
        padding: "18px",
        cursor: "pointer",
    },

    taskHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "20px",
    },

    taskMain: {
        flex: 1,
        minWidth: 0,
    },

    taskTitle: {
        margin: "0 0 8px 0",
        color: "#ffffff",
        fontSize: "17px",
        overflowWrap: "anywhere",
    },

    taskDescription: {
        margin: 0,
        color: "#aeb3bd",
        fontSize: "13px",
        lineHeight: "1.5",
        overflowWrap: "anywhere",
    },

    status: {
        height: "fit-content",
        padding: "5px 9px",
        borderRadius: "15px",
        fontSize: "11px",
        fontWeight: "600",
        textTransform: "capitalize",
        whiteSpace: "nowrap",
    },

    completed: {
        background: "#24382f",
        color: "#5ee89a",
    },

    partial: {
        background: "#3d3523",
        color: "#f4c95d",
    },

    pending: {
        background: "#30343d",
        color: "#bfc3ca",
    },

    taskInfo: {
        display: "flex",
        flexWrap: "wrap",
        gap: "20px",
        alignItems: "center",
        marginTop: "15px",
        color: "#9ca3af",
        fontSize: "12px",
    },

    viewText: {
        marginLeft: "auto",
        color: "#8d86ff",
        fontWeight: "600",
    },

    progressBackground: {
        height: "6px",
        background: "#292d38",
        borderRadius: "10px",
        marginTop: "12px",
        overflow: "hidden",
    },

    progress: {
        height: "100%",
        background: "#6c63ff",
        borderRadius: "10px",
        transition: "width 0.3s ease",
    },

    emptyCard: {
        background: "#171a21",
        border: "1px solid #292d38",
        borderRadius: "12px",
        padding: "40px",
        textAlign: "center",
        color: "#f5f5f5",
    },
};

export default History;

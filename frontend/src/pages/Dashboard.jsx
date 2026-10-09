
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Dashboard() {
    const navigate = useNavigate();

    const [tasks, setTasks] = useState([]);
    const [profile, setProfile] = useState(null);
    const [totalXp, setTotalXp] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadDashboard = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [tasksResult, profileResult, rewardsResult] =
                await Promise.allSettled([
                    api.get("tasks/"),
                    api.get("auth/profile/"),
                    api.get("rewards/"),
                ]);

            if (tasksResult.status === "fulfilled") {
                const data = tasksResult.value.data;
                setTasks(
                    Array.isArray(data) ? data : data.results || []
                );
            } else {
                console.error("Tasks loading failed:", tasksResult.reason);
                setError("Could not load tasks. Please refresh the page.");
            }

            if (profileResult.status === "fulfilled") {
                setProfile(profileResult.value.data);
            } else {
                console.error("Profile loading failed:", profileResult.reason);
            }

            if (rewardsResult.status === "fulfilled") {
                const data = rewardsResult.value.data;
                const rewards = Array.isArray(data)
                    ? data
                    : data.results || [];

                const earnedXp = rewards.reduce(
                    (sum, reward) =>
                        sum + Number(reward.xp_earned || 0),
                    0
                );

                setTotalXp(earnedXp);
            } else {
                console.error("Rewards loading failed:", rewardsResult.reason);
                setTotalXp(0);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const today = new Date();
    const todayString = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0"),
    ].join("-");

    const todayTasks = tasks.filter(
        (task) => task.task_date === todayString
    );

    const completedTasks = tasks.filter(
        (task) => task.status === "completed"
    );

    const todayProgress = todayTasks.length
        ? Math.round(
              todayTasks.reduce(
                  (sum, task) =>
                      sum + Number(task.completion_percentage || 0),
                  0
              ) / todayTasks.length
          )
        : 0;

    const handleLogout = () => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        navigate("/", { replace: true });
    };

    if (loading) {
        return (
            <div style={styles.page}>
                <p style={styles.muted}>Loading your dashboard...</p>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <main style={styles.container}>
                <header style={styles.header}>
                    <div>
                        <p style={styles.brand}>🎓 VeriLearn</p>
                        <h1>Welcome back{profile?.username ? `, ${profile.username}` : ""}!</h1>
                        <p style={styles.muted}>
                            Learn better. Prove your progress. Keep improving.
                        </p>
                    </div>

                    <button
                        style={styles.logoutButton}
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </header>

                {error && (
                    <div style={styles.errorBox}>
                        {error}
                        <button
                            style={styles.smallButton}
                            onClick={loadDashboard}
                        >
                            Retry
                        </button>
                    </div>
                )}

                <section style={styles.statsGrid}>
                    <StatCard
                        icon="⭐"
                        label="Total XP"
                        value={profile?.xp ?? totalXp}
                    />
                    <StatCard
                        icon="🪙"
                        label="Coins Balance"
                        value={profile?.coins ?? 0}
                    />
                    <StatCard
                        icon="✅"
                        label="Tasks Completed"
                        value={completedTasks.length}
                    />
                    <StatCard
                        icon="🔥"
                        label="Current Streak"
                        value={`${profile?.current_streak ?? 0} days`}
                    />
                </section>

                <section style={styles.card}>
                    <div style={styles.sectionHeader}>
                        <div>
                            <h2>Today's Learning Progress</h2>
                            <p style={styles.muted}>
                                {todayTasks.length} task(s) scheduled for today
                            </p>
                        </div>
                        <strong style={styles.progressLabel}>
                            {todayProgress}%
                        </strong>
                    </div>

                    <div style={styles.progressBackground}>
                        <div
                            style={{
                                ...styles.progressFill,
                                width: `${todayProgress}%`,
                            }}
                        />
                    </div>

                    {todayTasks.length === 0 && (
                        <p style={styles.muted}>
                            No tasks scheduled for today. Create a task to
                            start tracking your progress.
                        </p>
                    )}
                </section>

                <section style={styles.actionGrid}>
                    <ActionCard
                        icon="➕"
                        title="Create New Task"
                        description="Set your own learning goal."
                        onClick={() => navigate("/create-task")}
                    />

                    <ActionCard
                        icon="🧠"
                        title="Personalized Revision"
                        description="Search previous learning feedback and revisit concepts."
                        onClick={() => navigate("/revision")}
                    />

                    <ActionCard
                        icon="🎁"
                        title="Reward Shop"
                        description="Check available rewards and redeem items."
                        onClick={() => navigate("/shop")}
                    />

                    <ActionCard
                        icon="📚"
                        title="Learning History"
                        description="Review your past tasks and progress."
                        onClick={() => navigate("/history")}
                    />
                </section>

                <section style={styles.card}>
                    <div style={styles.sectionHeader}>
                        <h2>Your Tasks</h2>
                        <button
                            style={styles.smallButton}
                            onClick={loadDashboard}
                        >
                            Refresh
                        </button>
                    </div>

                    {tasks.length === 0 ? (
                        <div style={styles.emptyState}>
                            <p>No tasks yet.</p>
                            <button
                                style={styles.primaryButton}
                                onClick={() => navigate("/create-task")}
                            >
                                Create Your First Task
                            </button>
                        </div>
                    ) : (
                        <div style={styles.taskList}>
                            {tasks.map((task) => (
                                <button
                                    key={task.id}
                                    style={styles.taskCard}
                                    onClick={() => navigate(`/task/${task.id}`)}
                                >
                                    <div style={styles.taskTop}>
                                        <strong>{task.title}</strong>
                                        <span
                                            style={{
                                                ...styles.statusBadge,
                                                ...(task.status === "completed"
                                                    ? styles.completedBadge
                                                    : task.status === "partial"
                                                      ? styles.partialBadge
                                                      : styles.pendingBadge),
                                            }}
                                        >
                                            {task.status}
                                        </span>
                                    </div>

                                    <p style={styles.taskDescription}>
                                        {task.description}
                                    </p>

                                    <div style={styles.taskMeta}>
                                        <span>📅 {task.task_date}</span>
                                        <span>
                                            ⏱ {task.estimated_minutes} min
                                        </span>
                                        <span>
                                            {task.completion_percentage ?? 0}%
                                            complete
                                        </span>
                                    </div>

                                    <div style={styles.progressBackground}>
                                        <div
                                            style={{
                                                ...styles.progressFill,
                                                width: `${Math.max(
                                                    0,
                                                    Math.min(
                                                        100,
                                                        Number(
                                                            task.completion_percentage || 0
                                                        )
                                                    )
                                                )}%`,
                                            }}
                                        />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                <footer style={styles.footer}>
                    Keep learning, one task at a time. 💜
                </footer>
            </main>
        </div>
    );
}

function StatCard({ icon, label, value }) {
    return (
        <div style={styles.statCard}>
            <span style={styles.statIcon}>{icon}</span>
            <p style={styles.statLabel}>{label}</p>
            <h2>{value}</h2>
        </div>
    );
}

function ActionCard({ icon, title, description, onClick }) {
    return (
        <button style={styles.actionCard} onClick={onClick}>
            <span style={styles.actionIcon}>{icon}</span>
            <strong>{title}</strong>
            <span style={styles.actionDescription}>{description}</span>
        </button>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#111318",
        color: "#f4f4f5",
        padding: "28px 16px",
        boxSizing: "border-box",
        fontFamily: "Arial, sans-serif",
    },
    container: {
        maxWidth: "1100px",
        margin: "0 auto",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: "16px",
        marginBottom: "28px",
    },
    brand: {
        color: "#b4a7ff",
        fontWeight: "bold",
        fontSize: "18px",
    },
    muted: {
        color: "#aeb4c2",
        lineHeight: 1.6,
    },
    logoutButton: {
        background: "#292d36",
        color: "#fff",
        border: "1px solid #414653",
        padding: "10px 16px",
        borderRadius: "7px",
        cursor: "pointer",
    },
    statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "14px",
        marginBottom: "20px",
    },
    statCard: {
        background: "#1b1e26",
        border: "1px solid #343946",
        borderRadius: "10px",
        padding: "20px",
    },
    statIcon: {
        fontSize: "24px",
    },
    statLabel: {
        color: "#b4b9c5",
        marginBottom: "8px",
    },
    card: {
        background: "#191c23",
        border: "1px solid #30343f",
        borderRadius: "10px",
        padding: "22px",
        marginBottom: "20px",
    },
    sectionHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
        marginBottom: "14px",
    },
    progressLabel: {
        color: "#b4a7ff",
        fontSize: "24px",
    },
    progressBackground: {
        height: "8px",
        background: "#343846",
        borderRadius: "20px",
        overflow: "hidden",
        marginTop: "12px",
    },
    progressFill: {
        height: "100%",
        background: "#7764ef",
        borderRadius: "20px",
        transition: "width 0.3s ease",
    },
    actionGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "14px",
        marginBottom: "20px",
    },
    actionCard: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "10px",
        textAlign: "left",
        background: "#1b1e26",
        border: "1px solid #343946",
        borderRadius: "10px",
        padding: "20px",
        color: "#f4f4f5",
        cursor: "pointer",
    },
    actionIcon: {
        fontSize: "27px",
    },
    actionDescription: {
        color: "#aeb4c2",
        lineHeight: 1.5,
        fontSize: "13px",
    },
    taskList: {
        display: "grid",
        gap: "12px",
    },
    taskCard: {
        width: "100%",
        textAlign: "left",
        background: "#222630",
        border: "1px solid #343946",
        borderRadius: "9px",
        padding: "16px",
        color: "#f4f4f5",
        cursor: "pointer",
        boxSizing: "border-box",
    },
    taskTop: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "10px",
    },
    statusBadge: {
        padding: "5px 9px",
        borderRadius: "20px",
        fontSize: "12px",
    },
    completedBadge: {
        background: "#164b37",
        color: "#8cf0bf",
    },
    partialBadge: {
        background: "#51401b",
        color: "#f5d27b",
    },
    pendingBadge: {
        background: "#343846",
        color: "#d1d5df",
    },
    taskDescription: {
        color: "#b9bfcc",
        lineHeight: 1.5,
    },
    taskMeta: {
        display: "flex",
        flexWrap: "wrap",
        gap: "14px",
        color: "#aeb4c2",
        fontSize: "12px",
    },
    primaryButton: {
        background: "#6654db",
        color: "#fff",
        border: "none",
        borderRadius: "7px",
        padding: "11px 16px",
        cursor: "pointer",
    },
    smallButton: {
        background: "#343846",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        padding: "8px 12px",
        cursor: "pointer",
    },
    emptyState: {
        textAlign: "center",
        padding: "20px",
    },
    errorBox: {
        color: "#ffaaaa",
        background: "#351d25",
        border: "1px solid #713844",
        borderRadius: "8px",
        padding: "14px",
        marginBottom: "18px",
    },
    footer: {
        textAlign: "center",
        color: "#8f96a6",
        padding: "20px 0",
    },
};

export default Dashboard;

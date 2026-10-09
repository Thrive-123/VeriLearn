
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function RewardShop() {
    const navigate = useNavigate();

    const [items, setItems] = useState([]);
    const [redemptions, setRedemptions] = useState([]);
    const [coins, setCoins] = useState(0);
    const [loading, setLoading] = useState(true);
    const [redeemingId, setRedeemingId] = useState(null);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const headers = () => ({
        Authorization: `Bearer ${localStorage.getItem("access")}`,
    });

    const fetchData = async () => {
        if (!localStorage.getItem("access")) {
            navigate("/");
            return;
        }

        try {
            const [itemsResponse, profileResponse, historyResponse] =
                await Promise.all([
                    api.get("rewards/shop/", { headers: headers() }),
                    api.get("auth/profile/", { headers: headers() }),
                    api.get("rewards/redemptions/", { headers: headers() }),
                ]);

            setItems(
                Array.isArray(itemsResponse.data)
                    ? itemsResponse.data
                    : itemsResponse.data.results || []
            );

            setCoins(profileResponse.data.coins ?? 0);

            setRedemptions(
                Array.isArray(historyResponse.data)
                    ? historyResponse.data
                    : historyResponse.data.results || []
            );
        } catch (err) {
            console.error("REWARD SHOP ERROR:", err);

            if (err.response?.status === 401) {
                localStorage.removeItem("access");
                localStorage.removeItem("refresh");
                navigate("/");
            } else {
                setError(
                    err.response?.data?.detail ||
                    "Unable to load the Reward Shop."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const redeemReward = async (item) => {
        if (coins < item.coin_cost) {
            setError("You do not have enough coins.");
            return;
        }

        if (!window.confirm(
            `Redeem ${item.name} for ${item.coin_cost} coins?`
        )) {
            return;
        }

        try {
            setRedeemingId(item.id);
            setError("");
            setMessage("");

            const response = await api.post(
                "rewards/redeem/",
                { item_id: item.id },
                { headers: headers() }
            );

            setCoins(response.data.coins_balance);
            setMessage(response.data.message);

            const [profileResponse, historyResponse] = await Promise.all([
                api.get("auth/profile/", { headers: headers() }),
                api.get("rewards/redemptions/", { headers: headers() }),
            ]);

            setCoins(profileResponse.data.coins ?? response.data.coins_balance);

            setRedemptions(
                Array.isArray(historyResponse.data)
                    ? historyResponse.data
                    : historyResponse.data.results || []
            );
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Redemption failed. Please try again."
            );

            if (err.response?.data?.coins_balance !== undefined) {
                setCoins(err.response.data.coins_balance);
            }
        } finally {
            setRedeemingId(null);
        }
    };

    if (loading) {
        return <div style={styles.center}>Loading Reward Shop...</div>;
    }

    return (
        <div style={styles.page}>
            <header style={styles.header}>
                <div>
                    <h1 style={styles.title}>🎁 Reward Shop</h1>
                    <p style={styles.subtitle}>
                        Redeem your learning coins for virtual rewards.
                    </p>
                </div>

                <button
                    style={styles.secondaryButton}
                    onClick={() => navigate("/dashboard")}
                >
                    ← Dashboard
                </button>
            </header>

            <section style={styles.balanceCard}>
                <div>
                    <p style={styles.balanceLabel}>Available Balance</p>
                    <h2 style={styles.balance}>🪙 {coins} Coins</h2>
                </div>
                <span style={styles.balanceIcon}>🎁</span>
            </section>

            {message && (
                <div style={styles.successMessage}>{message}</div>
            )}

            {error && (
                <div style={styles.errorMessage}>{error}</div>
            )}

            <h2 style={styles.sectionTitle}>Available Rewards</h2>

            {items.length === 0 ? (
                <div style={styles.emptyCard}>
                    No rewards available right now.
                </div>
            ) : (
                <div style={styles.grid}>
                    {items.map((item) => {
                        const canAfford = coins >= item.coin_cost;

                        return (
                            <article key={item.id} style={styles.rewardCard}>
                                <div style={styles.rewardIcon}>
                                    {item.icon || "🎁"}
                                </div>

                                <h3>{item.name}</h3>

                                <p style={styles.description}>
                                    {item.description}
                                </p>

                                <p style={styles.cost}>
                                    🪙 {item.coin_cost} Coins
                                </p>

                                <button
                                    style={{
                                        ...styles.redeemButton,
                                        ...(canAfford
                                            ? {}
                                            : styles.disabledButton),
                                    }}
                                    disabled={
                                        !canAfford || redeemingId !== null
                                    }
                                    onClick={() => redeemReward(item)}
                                >
                                    {redeemingId === item.id
                                        ? "Redeeming..."
                                        : canAfford
                                        ? "Redeem Reward"
                                        : "Not Enough Coins"}
                                </button>
                            </article>
                        );
                    })}
                </div>
            )}

            <section style={styles.historySection}>
                <h2 style={styles.sectionTitle}>
                    📜 Redemption History
                </h2>

                {redemptions.length === 0 ? (
                    <p style={styles.emptyText}>
                        You have not redeemed any rewards yet.
                    </p>
                ) : (
                    <div style={styles.historyList}>
                        {redemptions.map((redemption) => (
                            <div
                                key={redemption.id}
                                style={styles.historyItem}
                            >
                                <div>
                                    <strong>
                                        {redemption.item.icon}{" "}
                                        {redemption.item.name}
                                    </strong>
                                    <p style={styles.historyDate}>
                                        {new Date(
                                            redemption.redeemed_at
                                        ).toLocaleString()}
                                    </p>
                                </div>

                                <strong style={styles.spent}>
                                    -{redemption.coins_spent} coins
                                </strong>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        padding: "30px",
        background: "#0f1117",
        color: "#f5f5f5",
        fontFamily: "Arial, sans-serif",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "15px",
        marginBottom: "25px",
    },
    title: { margin: 0, fontSize: "28px" },
    subtitle: { color: "#9ca3af", fontSize: "14px" },
    secondaryButton: {
        padding: "11px 16px",
        background: "#292d38",
        color: "#fff",
        border: "1px solid #414653",
        borderRadius: "8px",
        cursor: "pointer",
    },
    balanceCard: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "25px",
        background: "#1b1f27",
        border: "1px solid #303541",
        borderRadius: "12px",
        marginBottom: "30px",
    },
    balanceLabel: { color: "#aeb3bd", margin: 0 },
    balance: { marginBottom: 0, color: "#ffd166" },
    balanceIcon: { fontSize: "38px" },
    sectionTitle: { marginBottom: "18px", fontSize: "20px" },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "18px",
    },
    rewardCard: {
        background: "#1b1f27",
        border: "1px solid #303541",
        borderRadius: "12px",
        padding: "22px",
        textAlign: "center",
    },
    rewardIcon: { fontSize: "42px", marginBottom: "12px" },
    description: {
        color: "#aeb3bd",
        fontSize: "13px",
        minHeight: "36px",
        lineHeight: "1.5",
    },
    cost: { color: "#ffd166", fontWeight: "bold", margin: "18px 0" },
    redeemButton: {
        width: "100%",
        padding: "12px",
        background: "#6c63ff",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "600",
    },
    disabledButton: {
        background: "#3a3d46",
        color: "#aeb3bd",
        cursor: "not-allowed",
    },
    historySection: {
        marginTop: "35px",
        padding: "22px",
        background: "#1b1f27",
        border: "1px solid #303541",
        borderRadius: "12px",
    },
    historyList: { display: "flex", flexDirection: "column", gap: "12px" },
    historyItem: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        flexWrap: "wrap",
        padding: "15px",
        background: "#252a33",
        borderRadius: "8px",
    },
    historyDate: { color: "#9ca3af", fontSize: "12px", marginBottom: 0 },
    spent: { color: "#f4c95d" },
    emptyCard: {
        padding: "25px",
        background: "#1b1f27",
        borderRadius: "10px",
        color: "#9ca3af",
    },
    emptyText: { color: "#9ca3af" },
    successMessage: {
        background: "#20372c",
        color: "#72e5a1",
        padding: "14px",
        borderRadius: "8px",
        marginBottom: "20px",
    },
    errorMessage: {
        background: "#402629",
        color: "#ffaaaa",
        padding: "14px",
        borderRadius: "8px",
        marginBottom: "20px",
    },
    center: {
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#0f1117",
        color: "#fff",
    },
};

export default RewardShop;

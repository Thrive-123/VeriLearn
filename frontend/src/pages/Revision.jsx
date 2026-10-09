
import { useState } from "react";
import api from "../services/api";

function Revision() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searched, setSearched] = useState(false);

    const handleSearch = async (event) => {
        event.preventDefault();

        if (!query.trim()) {
            setError("Please enter a topic to revise.");
            return;
        }

        setLoading(true);
        setError("");
        setSearched(true);
        setResults([]);

        try {
            const response = await api.get("revision/search/", {
                params: { q: query.trim() },
            });

            setResults(response.data.results || []);
        } catch (err) {
            console.error("Revision search failed:", err);

            setError(
                err.response?.status === 401
                    ? "Your session expired. Please log in again."
                    : "Could not load revision memories. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            <main style={styles.container}>
                <h1>🧠 Personalized Revision</h1>

                <p style={styles.subtitle}>
                    Search your previous learning feedback and revisit
                    concepts that need more practice.
                </p>

                <form onSubmit={handleSearch} style={styles.searchForm}>
                    <input
                        type="text"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Try Java Polymorphism or DBMS Normalization"
                        maxLength={500}
                        style={styles.input}
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        style={styles.button}
                    >
                        {loading ? "Searching..." : "Search"}
                    </button>
                </form>

                {error && <p style={styles.error}>{error}</p>}

                {loading && <p>Finding relevant learning memories...</p>}

                {!loading && searched && !error && results.length === 0 && (
                    <div style={styles.card}>
                        <h3>No matching revision memories found</h3>
                        <p>
                            Try another topic, or upload evidence for a task
                            to create learning memories.
                        </p>
                    </div>
                )}

                {!loading && results.length > 0 && (
                    <>
                        <h2>Revision Results ({results.length})</h2>

                        {results.map((item) => (
                            <article key={item.id} style={styles.card}>
                                <h3>{item.topic}</h3>

                                {item.task_id && (
                                    <p style={styles.meta}>
                                        Task ID: {item.task_id}
                                    </p>
                                )}

                                <p style={styles.content}>{item.content}</p>

                                <p style={styles.meta}>
                                    Relevance score: {item.similarity}
                                </p>
                            </article>
                        ))}
                    </>
                )}
            </main>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#111318",
        color: "#f4f4f5",
        padding: "32px 16px",
        boxSizing: "border-box",
        fontFamily: "Arial, sans-serif",
    },
    container: {
        maxWidth: "850px",
        margin: "0 auto",
    },
    subtitle: {
        color: "#b8bdc8",
        lineHeight: 1.6,
    },
    searchForm: {
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
        margin: "24px 0",
    },
    input: {
        flex: "1 1 280px",
        minWidth: 0,
        padding: "13px",
        borderRadius: "7px",
        border: "1px solid #3c414e",
        background: "#20232c",
        color: "#fff",
        fontSize: "15px",
    },
    button: {
        padding: "12px 22px",
        border: "none",
        borderRadius: "7px",
        background: "#6b58e8",
        color: "#fff",
        fontWeight: "bold",
        cursor: "pointer",
    },
    card: {
        background: "#1b1e26",
        border: "1px solid #343946",
        borderRadius: "10px",
        padding: "20px",
        margin: "16px 0",
        overflowWrap: "anywhere",
    },
    content: {
        whiteSpace: "pre-wrap",
        lineHeight: 1.7,
        color: "#d8dbe3",
    },
    meta: {
        color: "#a9aebb",
        fontSize: "13px",
    },
    error: {
        color: "#ff8585",
    },
};

export default Revision;

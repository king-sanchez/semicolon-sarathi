"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { setStoredSession } from "../../lib/session";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.post("http://localhost:8000/api/users/login", {
        username,
        password
      });

      // Store user data for this tab only
      setStoredSession({
        userId: response.data.id,
        userName: response.data.name,
        username: response.data.username
      });

      // Redirect to dashboard
      router.push("/dashboard");

    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      fontFamily: "Arial, sans-serif"
    }}>
      <div style={{
        background: "white",
        borderRadius: "20px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        padding: "40px",
        maxWidth: "400px",
        width: "100%"
      }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1 style={{
            margin: 0,
            fontSize: "28px",
            color: "#333",
            marginBottom: "10px"
          }}>
            🇮🇳 Welcome Back
          </h1>
          <p style={{ color: "#666", margin: 0 }}>
            Login to access your schemes
          </p>
        </div>

        {error && (
          <div style={{
            background: "#ffebee",
            color: "#c62828",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "14px",
            border: "1px solid #ef5350"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              marginBottom: "8px",
              color: "#333",
              fontSize: "14px",
              fontWeight: "600"
            }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "8px",
                border: "2px solid #e0e0e0",
                fontSize: "14px",
                outline: "none",
                transition: "border-color 0.3s",
                boxSizing: "border-box"
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = "#667eea"}
              onBlur={(e) => e.currentTarget.style.borderColor = "#e0e0e0"}
            />
          </div>

          <div style={{ marginBottom: "25px" }}>
            <label style={{
              display: "block",
              marginBottom: "8px",
              color: "#333",
              fontSize: "14px",
              fontWeight: "600"
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "8px",
                border: "2px solid #e0e0e0",
                fontSize: "14px",
                outline: "none",
                transition: "border-color 0.3s",
                boxSizing: "border-box"
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = "#667eea"}
              onBlur={(e) => e.currentTarget.style.borderColor = "#e0e0e0"}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "8px",
              border: "none",
              background: loading ? "#ccc" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              marginBottom: "15px"
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <div style={{
            textAlign: "center",
            fontSize: "14px",
            color: "#666"
          }}>
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/")}
              style={{
                background: "none",
                border: "none",
                color: "#667eea",
                fontWeight: "600",
                cursor: "pointer",
                textDecoration: "underline"
              }}
            >
              Register here
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

//  

"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { clearStoredSession, getStoredSession } from "../../lib/session";

interface Message {
  type: "bot" | "user";
  text: string;
}

export default function Chat() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { 
      type: "bot", 
      text: "👋 Hello! I'm your Government Scheme Assistant. I already have your profile information, so you can ask me anything about government schemes without providing your details again. How can I help you today?" 
    }
  ]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const session = getStoredSession();

    if (!session?.userId) {
      router.push("/");
      return;
    }

    setUserId(session.userId);
    setUserName(session.userName || "User");
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userInput.trim() || loading) return;

    const question = userInput.trim();
    setUserInput("");
    
    // Add user message
    setMessages(prev => [...prev, { type: "user", text: question }]);
    setLoading(true);

    try {
      // Send question to AI
      const response = await axios.post("http://localhost:8000/api/chat", {
        message: `User Question: ${question}

Context: The user is already registered in the system with ID: ${userId}. They are asking about government schemes. Please provide helpful information about government schemes relevant to their question. Do not ask for their personal details as we already have them.`
      });

      setMessages(prev => [...prev, { 
        type: "bot", 
        text: response.data.reply 
      }]);

    } catch (error: any) {
      setMessages(prev => [...prev, { 
        type: "bot", 
        text: `❌ Sorry, I encountered an error: ${error.response?.data?.error || error.message || "Please try again."}` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    "What are the latest central government schemes?",
    "Tell me about education scholarships",
    "What health insurance schemes are available?",
    "How can I apply for housing schemes?",
    "What are the pension schemes for senior citizens?"
  ];

  return (
    <main style={{
      minHeight: "100vh",
      background: "#f5f7fa",
      fontFamily: "Arial, sans-serif"
    }}>
      {/* Header */}
      <header style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        padding: "20px 40px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "28px" }}>
              💬 AI Chat Assistant
            </h1>
            <p style={{ margin: "5px 0 0 0", opacity: 0.9 }}>
              Ask me anything about government schemes, {userName}!
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => router.push("/dashboard")}
              style={{
                padding: "10px 20px",
                borderRadius: "20px",
                border: "2px solid white",
                background: "transparent",
                color: "white",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600"
              }}
            >
              Dashboard
            </button>
            <button
              onClick={() => {
                clearStoredSession();
                router.push("/");
              }}
              style={{
                padding: "10px 20px",
                borderRadius: "20px",
                border: "2px solid white",
                background: "white",
                color: "#667eea",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600"
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div style={{
        maxWidth: "900px",
        margin: "40px auto",
        padding: "0 20px"
      }}>
        <div style={{
          background: "white",
          borderRadius: "20px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          height: "70vh"
        }}>
          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "30px",
            background: "#f5f5f5"
          }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: msg.type === "user" ? "flex-end" : "flex-start",
                  marginBottom: "20px",
                  animation: "fadeIn 0.3s ease-in"
                }}
              >
                <div style={{
                  maxWidth: "75%",
                  padding: "15px 20px",
                  borderRadius: "18px",
                  background: msg.type === "user" 
                    ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    : "white",
                  color: msg.type === "user" ? "white" : "#333",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                  wordWrap: "break-word",
                  whiteSpace: "pre-wrap",
                  lineHeight: "1.6"
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {loading && (
              <div style={{
                display: "flex",
                justifyContent: "flex-start",
                marginBottom: "20px"
              }}>
                <div style={{
                  padding: "15px 20px",
                  borderRadius: "18px",
                  background: "white",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
                }}>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <div style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: "#667eea",
                      animation: "bounce 1.4s infinite ease-in-out both"
                    }}></div>
                    <div style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: "#667eea",
                      animation: "bounce 1.4s infinite ease-in-out both 0.2s"
                    }}></div>
                    <div style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: "#667eea",
                      animation: "bounce 1.4s infinite ease-in-out both 0.4s"
                    }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length === 1 && (
            <div style={{
              padding: "15px 30px",
              background: "white",
              borderTop: "1px solid #e0e0e0"
            }}>
              <p style={{
                margin: "0 0 10px 0",
                fontSize: "14px",
                color: "#666",
                fontWeight: "600"
              }}>
                💡 Suggested questions:
              </p>
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px"
              }}>
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => setUserInput(q)}
                    style={{
                      padding: "8px 15px",
                      borderRadius: "15px",
                      border: "1px solid #e0e0e0",
                      background: "white",
                      color: "#667eea",
                      cursor: "pointer",
                      fontSize: "13px",
                      transition: "all 0.3s"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#f5f5f5";
                      e.currentTarget.style.borderColor = "#667eea";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "white";
                      e.currentTarget.style.borderColor = "#e0e0e0";
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div style={{
            padding: "20px 30px",
            background: "white",
            borderTop: "1px solid #e0e0e0"
          }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", gap: "12px" }}>
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Ask me anything about government schemes..."
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "14px 20px",
                  borderRadius: "25px",
                  border: "2px solid #e0e0e0",
                  fontSize: "15px",
                  outline: "none",
                  transition: "border-color 0.3s"
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = "#667eea"}
                onBlur={(e) => e.currentTarget.style.borderColor = "#e0e0e0"}
              />
              <button
                type="submit"
                disabled={loading || !userInput.trim()}
                style={{
                  padding: "14px 28px",
                  borderRadius: "25px",
                  border: "none",
                  background: loading || !userInput.trim() ? "#ccc" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  cursor: loading || !userInput.trim() ? "not-allowed" : "pointer",
                  fontSize: "15px",
                  fontWeight: "600"
                }}
              >
                {loading ? "Sending..." : "Send"}
              </button>
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </main>
  );
}

//  

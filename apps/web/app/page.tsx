"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { getStoredSession, setStoredSession } from "../lib/session";

interface Message {
  type: "bot" | "user";
  text: string;
}

interface FormData {
  name: string;
  email: string;
  age: string;
  gender: string;
  state: string;
  occupation: string;
  annualIncome: string;
  category: string;
  familySize: string;
}

interface Credentials {
  username: string;
  password: string;
}

const questions = [
  { key: "name", question: "What is your name?", type: "text" },
  { key: "email", question: "What is your email? (Optional - for notifications)", type: "email", optional: true },
  { key: "age", question: "What is your age?", type: "number" },
  { 
    key: "gender", 
    question: "What is your gender?", 
    type: "select",
    options: ["Male", "Female", "Other"]
  },
  { key: "state", question: "Which state do you live in?", type: "text" },
  { key: "occupation", question: "What is your occupation?", type: "text" },
  { key: "annualIncome", question: "What is your annual income (in ₹)?", type: "number" },
  { 
    key: "category", 
    question: "Which category do you belong to?", 
    type: "select",
    options: ["General", "SC", "ST", "OBC", "EWS"]
  },
  { key: "familySize", question: "What is your family size? (Optional)", type: "number", optional: true },
];

export default function Home() {
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { type: "bot", text: "👋 Welcome to the Government Scheme Eligibility Assistant! I'll help you find schemes you're eligible for. Let's start by getting to know you better." }
  ]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    age: "",
    gender: "",
    state: "",
    occupation: "",
    annualIncome: "",
    category: "",
    familySize: "",
  });
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user is already logged in
    const session = getStoredSession();
    if (session?.userId) {
      router.push("/dashboard");
      return;
    }

    // Ask first question
    if (currentQuestionIndex === 0 && messages.length === 1) {
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          type: "bot", 
          text: questions[0].question 
        }]);
      }, 500);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userInput.trim() && !questions[currentQuestionIndex].optional) return;

    const currentQuestion = questions[currentQuestionIndex];
    const answer = userInput.trim();

    // Add user message
    if (answer) {
      setMessages(prev => [...prev, { type: "user", text: answer }]);
    } else if (currentQuestion.optional) {
      setMessages(prev => [...prev, { type: "user", text: "Skip" }]);
    }

    // Update form data
    const updatedFormData = {
      ...formData,
      [currentQuestion.key]: answer
    };
    setFormData(updatedFormData);
    setUserInput("");

    // Check if we have more questions
    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          type: "bot", 
          text: questions[currentQuestionIndex + 1].question 
        }]);
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }, 500);
    } else {
      // All questions answered, create profile
      setIsComplete(true);
      setLoading(true);
      
      setTimeout(async () => {
        setMessages(prev => [...prev, { 
          type: "bot", 
          text: "✨ Great! I'm creating your profile and generating your login credentials..." 
        }]);

        try {
          const userRes = await axios.post("http://localhost:8000/api/users", {
            name: updatedFormData.name,
            email: updatedFormData.email || null,
            age: Number(updatedFormData.age),
            gender: updatedFormData.gender,
            state: updatedFormData.state,
            occupation: updatedFormData.occupation,
            annualIncome: Number(updatedFormData.annualIncome),
            category: updatedFormData.category,
            familySize: updatedFormData.familySize ? Number(updatedFormData.familySize) : null,
          });

          // Store credentials
          setCredentials({
            username: userRes.data.username,
            password: userRes.data.password
          });

          // Store user session for this tab only
          setStoredSession({
            userId: userRes.data.id,
            userName: userRes.data.name,
            username: userRes.data.username
          });

          setMessages(prev => [...prev, { 
            type: "bot", 
            text: `✅ Profile created successfully! Here are your login credentials. Please save them securely:

📝 Username: ${userRes.data.username}
🔑 Password: ${userRes.data.password}

You can now access your personalized dashboard!` 
          }]);

          setLoading(false);

        } catch (error: any) {
          setMessages(prev => [...prev, { 
            type: "bot", 
            text: `❌ Error: ${error.response?.data?.error || "Something went wrong. Please try again."}` 
          }]);
          setLoading(false);
          setIsComplete(false);
        }
      }, 1000);
    }
  };

  const handleSelectOption = (option: string) => {
    setUserInput(option);
    setTimeout(() => {
      const form = document.querySelector('form') as HTMLFormElement;
      form?.requestSubmit();
    }, 100);
  };

  const currentQuestion = questions[currentQuestionIndex];

  if (showLogin) {
    router.push("/login");
    return null;
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "20px",
      fontFamily: "Arial, sans-serif"
    }}>
      <div style={{
        maxWidth: "800px",
        margin: "0 auto",
        background: "white",
        borderRadius: "20px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "90vh"
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: "20px",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "24px" }}>
              🇮🇳 Government Scheme Assistant
            </h1>
            <p style={{ margin: "5px 0 0 0", opacity: 0.9, fontSize: "14px" }}>
              Find schemes you're eligible for
            </p>
          </div>
          <button
            onClick={() => setShowLogin(true)}
            style={{
              padding: "8px 16px",
              borderRadius: "20px",
              border: "2px solid white",
              background: "transparent",
              color: "white",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600"
            }}
          >
            Login
          </button>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          background: "#f5f5f5"
        }}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: msg.type === "user" ? "flex-end" : "flex-start",
                marginBottom: "15px",
                animation: "fadeIn 0.3s ease-in"
              }}
            >
              <div style={{
                maxWidth: "70%",
                padding: "12px 16px",
                borderRadius: "18px",
                background: msg.type === "user" 
                  ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  : "white",
                color: msg.type === "user" ? "white" : "#333",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                wordWrap: "break-word",
                whiteSpace: "pre-wrap"
              }}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{
              display: "flex",
              justifyContent: "flex-start",
              marginBottom: "15px"
            }}>
              <div style={{
                padding: "12px 16px",
                borderRadius: "18px",
                background: "white",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
              }}>
                <div style={{ display: "flex", gap: "5px" }}>
                  <div style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#667eea",
                    animation: "bounce 1.4s infinite ease-in-out both"
                  }}></div>
                  <div style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#667eea",
                    animation: "bounce 1.4s infinite ease-in-out both 0.2s"
                  }}></div>
                  <div style={{
                    width: "8px",
                    height: "8px",
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

        {/* Input Area or Credentials Display */}
        {credentials ? (
          <div style={{
            padding: "20px",
            background: "white",
            borderTop: "1px solid #e0e0e0"
          }}>
            <button
              onClick={() => router.push("/dashboard")}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "25px",
                border: "none",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "600",
                marginBottom: "10px"
              }}
            >
              Go to Dashboard →
            </button>
            <button
              onClick={() => {
                // Copy credentials to clipboard
                navigator.clipboard.writeText(`Username: ${credentials.username}\nPassword: ${credentials.password}`);
                alert("Credentials copied to clipboard!");
              }}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "25px",
                border: "2px solid #667eea",
                background: "white",
                color: "#667eea",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600"
              }}
            >
              📋 Copy Credentials
            </button>
          </div>
        ) : !isComplete && (
          <div style={{
            padding: "20px",
            background: "white",
            borderTop: "1px solid #e0e0e0"
          }}>
            {currentQuestion.type === "select" && (
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                marginBottom: "10px"
              }}>
                {currentQuestion.options?.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSelectOption(option)}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "20px",
                      border: "2px solid #667eea",
                      background: "white",
                      color: "#667eea",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      transition: "all 0.3s"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#667eea";
                      e.currentTarget.style.color = "white";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "white";
                      e.currentTarget.style.color = "#667eea";
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
            
            <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px" }}>
              <input
                type={currentQuestion.type === "select" ? "text" : currentQuestion.type}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={currentQuestion.optional ? "Type your answer or press Enter to skip..." : "Type your answer..."}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: "25px",
                  border: "2px solid #e0e0e0",
                  fontSize: "14px",
                  outline: "none",
                  transition: "border-color 0.3s"
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = "#667eea"}
                onBlur={(e) => e.currentTarget.style.borderColor = "#e0e0e0"}
              />
              <button
                type="submit"
                disabled={loading || (!userInput.trim() && !currentQuestion.optional)}
                style={{
                  padding: "12px 24px",
                  borderRadius: "25px",
                  border: "none",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  opacity: loading || (!userInput.trim() && !currentQuestion.optional) ? 0.5 : 1
                }}
              >
                {currentQuestion.optional && !userInput.trim() ? "Skip" : "Send"}
              </button>
            </form>
          </div>
        )}
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

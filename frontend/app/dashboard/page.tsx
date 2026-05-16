"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { clearStoredSession, getStoredSession } from "../../lib/session";

interface Scheme {
  name: string;
  type: string;
  description: string;
  benefits: string;
  eligibility: string;
  documents: string;
  applicationUrl: string;
}

const normalizeScheme = (scheme: any): Scheme => ({
  name: scheme.name || scheme.schemeName || "Government Scheme",
  type: scheme.type || scheme.schemeType || (scheme.state ? "State Government" : "Central Government"),
  description: scheme.description || "Government scheme for eligible citizens",
  benefits: scheme.benefits || "Financial and social benefits",
  eligibility: scheme.eligibility || "Check official website for eligibility",
  documents: scheme.documents || scheme.requiredDocuments || "Standard documents required",
  applicationUrl: scheme.applicationUrl || "Visit official government portal"
});

export default function Dashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [schemes, setSchemes] = useState<string>("");
  const [parsedSchemes, setParsedSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [lastUpdated, setLastUpdated] = useState("");
  const [aiRecommendations, setAiRecommendations] = useState<string>("");
  const [fallbackMethod, setFallbackMethod] = useState<string>("");

  useEffect(() => {
    const session = getStoredSession();

    if (!session?.userId) {
      router.push("/");
      return;
    }

    setUserId(session.userId);
    setUserName(session.userName || "User");

    // Fetch schemes every time the component mounts
    fetchSchemes(session.userId);
  }, [router]);

  const fetchSchemes = async (userId: string, forceRefresh = false) => {
    try {
      setError("");
      setAiRecommendations("");
      setFallbackMethod("");

      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await axios.get(`http://localhost:8000/api/users/${userId}/schemes`, {
        params: {
          refresh: forceRefresh
        }
      });

      console.log("API Response:", response.data);

      // Handle schemes - API returns array, convert to string for legacy code
      const schemesData = response.data.schemes || [];
      const schemesArray = Array.isArray(schemesData) ? schemesData : [];
      const schemesText = typeof schemesData === "string" ? schemesData : "";
      const aiRecs = response.data.aiRecommendations || "";
      const method = response.data.metadata?.method || "";
      const parsedSchemesFromAPI = response.data.parsedSchemes || [];

      console.log("Schemes array:", schemesArray);
      console.log("Schemes text:", schemesText);
      console.log("Parsed schemes from API:", parsedSchemesFromAPI.length);
      console.log("AI Recommendations:", aiRecs ? "Present (" + aiRecs.length + " chars)" : "Not present");
      console.log("Method:", method);

      // Parse schemes from either database results, pre-parsed API schemes, or AI recommendations
      let parsed: Scheme[] = [];
      if (schemesArray.length > 0) {
        // Normalize database scheme records into the shape used by the dashboard
        parsed = schemesArray.map(normalizeScheme);
      } else if (parsedSchemesFromAPI.length > 0) {
        // Use pre-parsed schemes from API (AI-generated schemes already parsed)
        parsed = parsedSchemesFromAPI.map(normalizeScheme);
        console.log("Using pre-parsed schemes from API:", parsed.length);
      } else if (aiRecs) {
        // Parse from AI recommendations text as fallback
        parsed = parseSchemes(aiRecs);
        console.log("Parsed schemes from AI recommendations:", parsed.length);
      }
      
      // Additional fallback: If parsedSchemesFromAPI was provided but empty, try parsing aiRecs
      if (parsed.length === 0 && aiRecs && parsedSchemesFromAPI.length === 0) {
        console.log("Attempting additional parsing of AI recommendations...");
        parsed = parseSchemes(aiRecs);
        console.log("Additional parsing resulted in:", parsed.length, "schemes");
      }

      setSchemes(schemesText);
      setParsedSchemes(parsed);
      setLastUpdated(response.data.updatedAt || "");
      setAiRecommendations(aiRecs);
      setFallbackMethod(method);

      // Only show error if no schemes AND no AI recommendations
      const hasSchemes = schemesArray.length > 0 || parsed.length > 0 || (schemesText && schemesText.trim());
      const hasAiRecs = aiRecs && aiRecs.trim();
      
      console.log("Has schemes:", hasSchemes);
      console.log("Has AI recs:", hasAiRecs);
      
      if (!hasSchemes && !hasAiRecs) {
        console.log("Setting error: No schemes and no AI recommendations");
        setError("No eligible schemes were returned for this user.");
      } else {
        console.log("Success: Either schemes or AI recommendations present");
      }
    } catch (err: any) {
      setSchemes("");
      setParsedSchemes([]);
      setAiRecommendations("");
      setFallbackMethod("");
      setError(err.response?.data?.error || "Failed to load schemes");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const parseSchemes = (text: string): Scheme[] => {
    const schemes: Scheme[] = [];
    
    // Split by numbered sections (1., 2., etc.) or by scheme headers
    const schemeBlocks = text.split(/(?=(?:\*\*)?\d+\.\s+)|(?=###\s+\w+\.)|(?=###\s+\*\*)/);
    
    schemeBlocks.forEach((block) => {
      if (!block.trim() || block.length < 20) return;
      
      const lines = block.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length === 0) return;
      
      // Extract scheme name (usually first line with ** or after number)
      let schemeName = '';
      let schemeType = '';
      let description = '';
      let benefits = '';
      let eligibility = '';
      let documents = '';
      let applicationUrl = '';
      
      let currentSection = '';
      
      lines.forEach((line, idx) => {
        // Extract scheme name
        const isNumberedSchemeLine = line.match(/^(?:\*\*)?\d+\.\s+/);
        const isHeadingLine = line.startsWith('###');

        if (isNumberedSchemeLine || (idx === 0 && !isHeadingLine)) {
          const nameMatch = line.match(/(?:\*\*)?\d+\.\s+([^*]+?)(?:\*\*)?$/) || line.match(/\*\*([^*]+)\*\*/);
          if (nameMatch) {
            schemeName = nameMatch[1].trim();
          }
        }
        
        // Detect type
        if (line.includes('*   **Type:**') || line.includes('Type:')) {
          const normalizedLine = line.toLowerCase();

          if (normalizedLine.includes('state government') || normalizedLine.includes('state scheme')) {
            schemeType = 'State Government';
          } else if (
            normalizedLine.includes('central government') ||
            normalizedLine.includes('centrally sponsored') ||
            normalizedLine.includes('central sector')
          ) {
            schemeType = 'Central Government';
          } else {
            schemeType = line.replace(/.*Type:\*?\*?/i, '').replace(/\*\*/g, '').trim();
          }
        }
        
        // Detect sections
        if (line.includes('**Eligibility') || line.includes('Eligibility Criteria')) {
          currentSection = 'eligibility';
        } else if (line.includes('**Benefits') || line.includes('Benefits:')) {
          currentSection = 'benefits';
        } else if (line.includes('**Required Documents') || line.includes('Documents:')) {
          currentSection = 'documents';
        } else if (line.includes('**How to Apply') || line.includes('Official Website')) {
          currentSection = 'application';
        } else if (currentSection) {
          // Add content to current section
          const content = line.replace(/^\*\s+/, '').replace(/^-\s+/, '').trim();
          if (content && !content.includes('**')) {
            if (currentSection === 'eligibility') eligibility += content + '\n';
            else if (currentSection === 'benefits') benefits += content + '\n';
            else if (currentSection === 'documents') documents += content + '\n';
            else if (currentSection === 'application') {
              applicationUrl += content + ' ';
              // Extract URL if present
              const urlMatch = content.match(/\[(.*?)\]\((.*?)\)/);
              if (urlMatch) applicationUrl = urlMatch[2];
            }
          }
        } else if (!description && line && !line.includes('**') && !line.match(/^\d+\./)) {
          description = line;
        }
      });
      
      if (schemeName) {
        schemes.push({
          name: schemeName,
          type: schemeType || 'Government Scheme',
          description: description || 'Government scheme for eligible citizens',
          benefits: benefits || 'Financial and social benefits',
          eligibility: eligibility || 'Check official website for eligibility',
          documents: documents || 'Standard documents required',
          applicationUrl: applicationUrl.trim() || 'Visit official government portal'
        });
      }
    });
    
    return schemes;
  };

  const handleLogout = async () => {
    if (userId) {
      try {
        await axios.delete(`http://localhost:8000/api/users/${userId}/schemes/cache`);
      } catch (err) {
        console.error("Failed to clear scheme cache:", err);
      }
    }

    clearStoredSession();
    router.push("/");
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize: "24px"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "50px",
            height: "50px",
            border: "5px solid rgba(255,255,255,0.3)",
            borderTop: "5px solid white",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 20px"
          }}></div>
          <p>Loading your eligible schemes...</p>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

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
              🇮🇳 Government Schemes Dashboard
            </h1>
            <p style={{ margin: "5px 0 0 0", opacity: 0.9 }}>
              Welcome back, {userName}!
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => userId && fetchSchemes(userId, true)}
              disabled={loading || refreshing}
              style={{
                padding: "10px 20px",
                borderRadius: "20px",
                border: "2px solid white",
                background: "white",
                color: "#667eea",
                cursor: loading || refreshing ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "600",
                opacity: loading || refreshing ? 0.7 : 1
              }}
            >
              {loading || refreshing ? "⏳ Loading..." : "🔄 Refresh"}
            </button>
            <button
              onClick={() => router.push("/chat")}
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
              💬 AI Chat
            </button>
            <button
              onClick={handleLogout}
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
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div style={{
        maxWidth: "1200px",
        margin: "40px auto",
        padding: "0 20px"
      }}>
        {error && (
          <div style={{
            background: "#ffebee",
            color: "#c62828",
            padding: "15px 20px",
            borderRadius: "10px",
            marginBottom: "20px",
            border: "1px solid #ef5350"
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Stats Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginBottom: "40px"
        }}>
          <div style={{
            background: "white",
            padding: "25px",
            borderRadius: "15px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            border: "2px solid #667eea"
          }}>
            <div style={{ fontSize: "36px", marginBottom: "10px" }}>📋</div>
            <div style={{ fontSize: "32px", fontWeight: "bold", color: "#667eea" }}>
              {parsedSchemes.length}
            </div>
            <div style={{ color: "#666", marginTop: "5px" }}>Eligible Schemes</div>
          </div>

          <div style={{
            background: "white",
            padding: "25px",
            borderRadius: "15px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            border: "2px solid #4caf50"
          }}>
            <div style={{ fontSize: "36px", marginBottom: "10px" }}>🏛️</div>
            <div style={{ fontSize: "32px", fontWeight: "bold", color: "#4caf50" }}>
              {parsedSchemes.filter(s => s.type.toLowerCase().includes('central')).length}
            </div>
            <div style={{ color: "#666", marginTop: "5px" }}>Central Schemes</div>
          </div>

          <div style={{
            background: "white",
            padding: "25px",
            borderRadius: "15px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            border: "2px solid #ff9800"
          }}>
            <div style={{ fontSize: "36px", marginBottom: "10px" }}>🏘️</div>
            <div style={{ fontSize: "32px", fontWeight: "bold", color: "#ff9800" }}>
              {parsedSchemes.filter(s => s.type.toLowerCase().includes('state')).length}
            </div>
            <div style={{ color: "#666", marginTop: "5px" }}>State Schemes</div>
          </div>
        </div>

        {/* Schemes Grid */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          marginBottom: "20px",
          flexWrap: "wrap"
        }}>
          <h2 style={{ margin: 0, color: "#333" }}>Your Eligible Schemes</h2>
          {lastUpdated && (
            <span style={{ color: "#666", fontSize: "14px" }}>
              Last updated: {new Date(lastUpdated).toLocaleString()}
            </span>
          )}
        </div>
        
        {parsedSchemes.length > 0 ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            gap: "20px"
          }}>
            {parsedSchemes.map((scheme, index) => (
              <div
                key={index}
                onClick={() => setSelectedScheme(scheme)}
                style={{
                  background: "white",
                  borderRadius: "15px",
                  padding: "25px",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  border: "2px solid transparent"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                  e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
                  e.currentTarget.style.borderColor = "#667eea";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.1)";
                  e.currentTarget.style.borderColor = "transparent";
                }}
              >
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
                  marginBottom: "15px"
                }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: "18px",
                    color: "#333",
                    flex: 1
                  }}>
                    {scheme.name}
                  </h3>
                  <span style={{
                    padding: "4px 12px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "600",
                    background: scheme.type.toLowerCase().includes('central') ? "#e3f2fd" : "#fff3e0",
                    color: scheme.type.toLowerCase().includes('central') ? "#1976d2" : "#f57c00"
                  }}>
                    {scheme.type.toLowerCase().includes('central') ? '🏛️ Central' : '🏘️ State'}
                  </span>
                </div>

                {scheme.description && (
                  <p style={{
                    color: "#666",
                    fontSize: "14px",
                    lineHeight: "1.6",
                    marginBottom: "15px"
                  }}>
                    {scheme.description.substring(0, 120)}...
                  </p>
                )}

                {scheme.benefits && (
                  <div style={{
                    background: "#f5f5f5",
                    padding: "10px",
                    borderRadius: "8px",
                    marginBottom: "15px"
                  }}>
                    <strong style={{ fontSize: "12px", color: "#667eea" }}>💰 Benefits:</strong>
                    <p style={{ margin: "5px 0 0 0", fontSize: "13px", color: "#666" }}>
                      {scheme.benefits.substring(0, 100)}...
                    </p>
                  </div>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedScheme(scheme);
                  }}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "none",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600"
                  }}
                >
                  View Details →
                </button>
              </div>
            ))}
          </div>
        ) : aiRecommendations ? (
          <div style={{
            background: "white",
            padding: "40px",
            borderRadius: "15px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
          }}>
            <div style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              padding: "20px",
              borderRadius: "10px",
              marginBottom: "30px",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "48px", marginBottom: "10px" }}>🤖</div>
              <h3 style={{ margin: "0 0 10px 0", fontSize: "24px" }}>AI-Generated Recommendations</h3>
              <p style={{ margin: 0, opacity: 0.9, fontSize: "14px" }}>
                No schemes found in database. Here are personalized recommendations from our AI assistant.
              </p>
            </div>

            <div style={{
              background: "#f8f9fa",
              padding: "25px",
              borderRadius: "10px",
              border: "2px solid #e9ecef",
              marginBottom: "20px"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "15px",
                paddingBottom: "15px",
                borderBottom: "2px solid #dee2e6"
              }}>
                <span style={{
                  background: "#667eea",
                  color: "white",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "600"
                }}>
                  ℹ️ Fallback Method: {fallbackMethod || 'AI Chatbot'}
                </span>
              </div>
              
              <div style={{
                whiteSpace: "pre-wrap",
                lineHeight: "1.8",
                fontSize: "15px",
                color: "#333"
              }}>
                {aiRecommendations}
              </div>
            </div>

            <div style={{
              background: "#fff3cd",
              border: "1px solid #ffc107",
              borderRadius: "10px",
              padding: "15px",
              marginBottom: "20px"
            }}>
              <strong style={{ color: "#856404", display: "block", marginBottom: "8px" }}>
                ⚠️ Important Notice
              </strong>
              <p style={{ margin: 0, color: "#856404", fontSize: "14px", lineHeight: "1.6" }}>
                These are AI-generated recommendations based on your profile. Please verify eligibility
                and details on official government websites before applying. The system will automatically
                populate with real schemes once the database is updated.
              </p>
            </div>

            <div style={{
              display: "flex",
              gap: "15px",
              justifyContent: "center",
              flexWrap: "wrap"
            }}>
              <button
                onClick={() => userId && fetchSchemes(userId, true)}
                disabled={refreshing}
                style={{
                  padding: "12px 24px",
                  borderRadius: "25px",
                  border: "none",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  cursor: refreshing ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  opacity: refreshing ? 0.7 : 1
                }}
              >
                {refreshing ? "⏳ Refreshing..." : "🔄 Retry Loading Schemes"}
              </button>
              
              <button
                onClick={() => router.push("/chat")}
                style={{
                  padding: "12px 24px",
                  borderRadius: "25px",
                  border: "2px solid #667eea",
                  background: "white",
                  color: "#667eea",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600"
                }}
              >
                💬 Chat with AI Assistant
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            background: "white",
            padding: "60px",
            borderRadius: "15px",
            textAlign: "center",
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
          }}>
            <div style={{ fontSize: "64px", marginBottom: "20px" }}>📋</div>
            <h3 style={{ color: "#333", marginBottom: "10px" }}>No schemes found</h3>
            <p style={{ color: "#666", marginBottom: "20px" }}>
              We couldn't find any schemes matching your profile.
            </p>
            <button
              onClick={() => userId && fetchSchemes(userId, true)}
              disabled={refreshing}
              style={{
                padding: "12px 24px",
                borderRadius: "25px",
                border: "none",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                cursor: refreshing ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "600",
                opacity: refreshing ? 0.7 : 1
              }}
            >
              {refreshing ? "⏳ Refreshing..." : "🔄 Retry"}
            </button>
          </div>
        )}

        {/* Raw AI Response (for debugging) */}
        {schemes && (
          <details style={{ marginTop: "40px" }}>
            <summary style={{
              cursor: "pointer",
              padding: "15px",
              background: "white",
              borderRadius: "10px",
              fontWeight: "600"
            }}>
              View Full AI Response
            </summary>
            <div style={{
              marginTop: "10px",
              padding: "20px",
              background: "white",
              borderRadius: "10px",
              whiteSpace: "pre-wrap",
              fontSize: "14px",
              lineHeight: "1.8",
              maxHeight: "400px",
              overflowY: "auto"
            }}>
              {schemes}
            </div>
          </details>
        )}
      </div>

      {/* Scheme Detail Modal */}
      {selectedScheme && (
        <div
          onClick={() => setSelectedScheme(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 1000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: "20px",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "80vh",
              overflowY: "auto",
              padding: "30px",
              position: "relative"
            }}
          >
            <button
              onClick={() => setSelectedScheme(null)}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                border: "none",
                background: "#f5f5f5",
                cursor: "pointer",
                fontSize: "18px"
              }}
            >
              ×
            </button>

            <h2 style={{ marginTop: 0, color: "#333" }}>{selectedScheme.name}</h2>
            
            {selectedScheme.type && (
              <span style={{
                display: "inline-block",
                padding: "6px 15px",
                borderRadius: "15px",
                fontSize: "14px",
                fontWeight: "600",
                background: selectedScheme.type.toLowerCase().includes('central') ? "#e3f2fd" : "#fff3e0",
                color: selectedScheme.type.toLowerCase().includes('central') ? "#1976d2" : "#f57c00",
                marginBottom: "20px"
              }}>
                {selectedScheme.type}
              </span>
            )}

            {selectedScheme.description && (
              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "16px", color: "#667eea", marginBottom: "10px" }}>📝 Description</h3>
                <p style={{ color: "#666", lineHeight: "1.6" }}>{selectedScheme.description}</p>
              </div>
            )}

            {selectedScheme.benefits && (
              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "16px", color: "#667eea", marginBottom: "10px" }}>💰 Benefits</h3>
                <p style={{ color: "#666", lineHeight: "1.6", whiteSpace: "pre-line" }}>{selectedScheme.benefits}</p>
              </div>
            )}

            {selectedScheme.eligibility && (
              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "16px", color: "#667eea", marginBottom: "10px" }}>✅ Eligibility Criteria</h3>
                <p style={{ color: "#666", lineHeight: "1.6", whiteSpace: "pre-line" }}>{selectedScheme.eligibility}</p>
              </div>
            )}

            {selectedScheme.documents && (
              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "16px", color: "#667eea", marginBottom: "10px" }}>📄 Required Documents</h3>
                <p style={{ color: "#666", lineHeight: "1.6", whiteSpace: "pre-line" }}>{selectedScheme.documents}</p>
              </div>
            )}

            {selectedScheme.applicationUrl && (
              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "16px", color: "#667eea", marginBottom: "10px" }}>🔗 How to Apply</h3>
                <p style={{ color: "#666", lineHeight: "1.6" }}>{selectedScheme.applicationUrl}</p>
              </div>
            )}

            <button
              onClick={() => setSelectedScheme(null)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: "none",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "600",
                marginTop: "20px"
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

//  

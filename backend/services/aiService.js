const axios = require("axios");

async function searchGovernmentSchemes(userProfile) {
  try {
    const prompt = `
You are an expert on Indian Government Schemes. Based on the user profile below, search and provide a comprehensive list of ALL eligible government schemes from both Central and State governments.

User Profile:
- Name: ${userProfile.name}
- Age: ${userProfile.age}
- Gender: ${userProfile.gender}
- State: ${userProfile.state}
- Occupation: ${userProfile.occupation}
- Annual Income: ₹${userProfile.annualIncome}
- Category: ${userProfile.category}
${userProfile.familySize ? `- Family Size: ${userProfile.familySize}` : ''}

Please provide:
1. **Scheme Name** (in bold)
2. **Type** (Central/State Government)
3. **Eligibility Criteria**
4. **Benefits**
5. **Required Documents**
6. **How to Apply** (with official website link if available)

Search for schemes in these categories:
- Financial assistance schemes
- Education/Scholarship schemes
- Health insurance schemes
- Pension schemes
- Housing schemes
- Agricultural schemes (if farmer)
- Women empowerment schemes (if female)
- Category-specific schemes (SC/ST/OBC/EWS)
- State-specific schemes for ${userProfile.state}

Format each scheme clearly with proper headings and bullet points. Include as many relevant schemes as possible.
`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      }
    );

    const result = response.data.candidates[0].content.parts[0].text;
    return result;

  } catch (error) {
    console.error("AI Service Error:", error.response?.data || error.message);
    throw new Error("Failed to search government schemes: " + (error.response?.data?.error?.message || error.message));
  }
}

async function generateRecommendation(user, schemesText) {
  try {
    const prompt = `
You are a Government Scheme Eligibility AI Assistant.

User Profile:
${JSON.stringify(user, null, 2)}

Available Schemes:
${schemesText}

Provide a personalized recommendation explaining:
1. Which schemes the user is most eligible for
2. Priority order of schemes to apply
3. Step-by-step application guidance
4. Important deadlines or requirements
5. Tips for successful application

Format the response in a clear, actionable manner.
`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      }
    );

    return response.data.candidates[0].content.parts[0].text;

  } catch (error) {
    console.error("AI Service Error:", error.response?.data || error.message);
    throw new Error("Failed to generate recommendation: " + (error.response?.data?.error?.message || error.message));
  }
}

module.exports = {
  searchGovernmentSchemes,
  generateRecommendation,
};

//  

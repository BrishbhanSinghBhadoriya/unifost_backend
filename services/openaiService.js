const axios = require('axios');
require('dotenv').config();

const getChatResponse = async (prompt) => {
  try {
    const response = await axios.post(
  'https://openrouter.ai/api/v1/chat/completions',
  {
    model: 'mistralai/mistral-small-24b-instruct-2501:free',
    messages: [{ role: 'user', content: prompt }]
  },
  {
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': process.env.FRONTEND_URL || 'https://unifostedu.com',
      'Content-Type': 'application/json'
    }
  }
);


    return response.data.choices[0].message.content;

  } catch (error) {
    console.error("🔥 OpenRouter API ERROR 🔥");

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error("❌ Request Error:", error.request);
    } else {
      console.error("❗ General Error:", error.message);
    }

    throw new Error("OpenRouter API call failed");
  }
};

module.exports = { getChatResponse };

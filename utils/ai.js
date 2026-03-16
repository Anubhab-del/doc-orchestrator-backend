const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function extractStructuredData(documentText, userQuestion) {
  const prompt = `
You are a precise document analysis assistant.

The user has uploaded a document and asked this specific question:
"${userQuestion}"

Your job:
1. Read the entire document carefully.
2. Extract ONLY the information that directly and specifically answers the user's question.
3. Do NOT return the entire document or unrelated fields.
4. Return between 5 to 8 key-value pairs that specifically answer what was asked.
5. If the question is about technical skills, return only skills and nothing else.
6. If the question is about experience, return only experience and nothing else.
7. Always be specific. Never dump raw text.

Document Content:
"""
${documentText}
"""

Respond ONLY with a valid JSON object in this exact format with no extra text outside it:
{
  "extracted_data": {
    "key1": "value1",
    "key2": "value2",
    "key3": "value3"
  },
  "relevance_summary": "One sentence explaining what was extracted and why it answers the question."
}
`;

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.3,
    max_tokens: 1024,
  });

  const text = completion.choices[0]?.message?.content?.trim();

  if (!text) {
    throw new Error("Groq returned an empty response.");
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("Groq did not return valid JSON. Raw: " + text);
    }
  }

  return parsed;
}

module.exports = { extractStructuredData };
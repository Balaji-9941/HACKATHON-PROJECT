const axios = require('axios');

/**
 * Optional Narrative Engine (LLM Layer)
 * Augments deterministic explanation factors with natural language summary
 * Strictly additive: falls back safely without throwing if API key is unset or call fails.
 */
class NarrativeEngine {
  constructor() {
    this.apiKey = process.env.AI_API_KEY || null;
    this.endpoint = process.env.AI_API_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  }

  /**
   * Generates a narrative paragraph based strictly on supplied evidence factors
   * @param {Object} data { factors, customer, amount, location, deviceName, riskScore }
   * @returns {Promise<string|null>}
   */
  async generateNarrative(data) {
    if (!this.apiKey) {
      return null;
    }

    try {
      const prompt = `You are a fintech fraud investigator analyst. Summarize the following transaction risk factors in a concise, authoritative 2-sentence explanation for a security report. Do not invent any facts not present in this data:
Amount: ₹${data.amount}
Customer: ${data.customer?.name || 'Customer'}
Risk Score: ${data.riskScore}/100
Factors:
${(data.factors || []).map(f => `- ${f.factor}: ${f.plainText}`).join('\n')}`;

      const response = await axios.post(`${this.endpoint}?key=${this.apiKey}`, {
        contents: [{ parts: [{ text: prompt }] }]
      }, {
        timeout: 1200,
        headers: { 'Content-Type': 'application/json' }
      });

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return text ? text.trim() : null;
    } catch (error) {
      // Clean fallback: never throw or break caller
      return null;
    }
  }

  async checkHealth() {
    return {
      enabled: Boolean(this.apiKey),
      healthy: Boolean(this.apiKey),
      provider: this.apiKey ? 'gemini' : 'none'
    };
  }
}

module.exports = new NarrativeEngine();

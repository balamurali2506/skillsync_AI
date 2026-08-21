import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Unified AI Generation Engine
 * Routes requests to the user's preferred provider and handles JSON parsing.
 */
export async function generateAIResponse({ provider, apiKey, model, systemPrompt, userPrompt, jsonMode = true }) {
  if (!apiKey) throw new Error(`No API key provided for ${provider}`);

  try {
    // 1. OpenAI & Groq (Groq uses the OpenAI SDK with a different base URL)
    if (provider === 'openai' || provider === 'groq') {
      const baseURL = provider === 'groq' ? 'https://api.groq.com/openai/v1' : undefined;
      const client = new OpenAI({ apiKey, baseURL });
      
      const res = await client.chat.completions.create({
        model: model || (provider === 'groq' ? 'llama-3.1-8b-instant' : 'gpt-4o-mini'),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: jsonMode ? { type: 'json_object' } : undefined,
        temperature: 0.5,
        max_tokens: 3000
      });
      return res.choices[0].message.content;
    } 
    
    // 2. Anthropic (Claude)
    else if (provider === 'anthropic') {
      const client = new Anthropic({ apiKey });
      const res = await client.messages.create({
        model: model || 'claude-3-haiku-20240307',
        max_tokens: 3000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      });
      return res.content[0].text;
    } 
    
    // 3. Google Gemini
    else if (provider === 'gemini') {
      const genAI = new GoogleGenerativeAI(apiKey);
      const aiModel = genAI.getGenerativeModel({ 
        model: model || 'gemini-1.5-flash',
        generationConfig: { responseMimeType: jsonMode ? "application/json" : "text/plain" }
      });
      
      const result = await aiModel.generateContent([
        `System Instructions: ${systemPrompt}`,
        `User Query: ${userPrompt}`
      ]);
      return result.response.text();
    } 
    
    else {
      throw new Error(`Unsupported provider: ${provider}`);
    }
  } catch (error) {
    console.error(`❌ AI Provider Error (${provider}):`, error.message);
    throw new Error(`AI generation failed: ${error.message}`);
  }
}
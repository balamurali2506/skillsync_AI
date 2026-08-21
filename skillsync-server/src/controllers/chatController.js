import ChatMessage from '../models/ChatMessage.js';
import { getAIClient } from '../services/interviewEngine.js';

export async function sendMessage(req, res, next) {
  try {
    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const userId = req.user._id;
    const aiConfig = await getAIClient(userId);

    if (!aiConfig) {
      return res.status(400).json({ 
        error: 'No Gemini API key configured. Please add your key in Settings.' 
      });
    }

    // Get last 10 messages for context
    const history = await ChatMessage.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10);

    const conversationContext = history
      .reverse()
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    const systemPrompt = `You are SkillSync AI Career Coach. Help with resumes, interviews, skills, and career advice.
Be helpful and concise (under 150 words).
IMPORTANT: You MUST respond in this EXACT JSON format:
{"response": "your helpful answer here", "suggestions": ["follow-up question 1", "follow-up question 2"]}

Do NOT include any text outside the JSON. Do NOT use markdown code blocks.`;

    const userPrompt = conversationContext 
      ? `Previous conversation:\n${conversationContext}\n\nNew question: ${message}`
      : message;

    try {
      const { client } = aiConfig;
      
      console.log('📤 Sending to Gemini...');
      
      const result = await client.chat.completions.create({
        model: 'gemini-3.6-flash',
        temperature: 0.7,
        max_tokens: 400,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      });

      const rawResponse = result.choices[0].message.content;
      console.log('✅ Gemini raw response:', rawResponse);

      let responseText = "I'm here to help with your career questions!";
      let suggestions = [];

      // Try multiple parsing strategies
      try {
        // Strategy 1: Direct parse
        const parsed = JSON.parse(rawResponse);
        if (parsed.response) {
          responseText = parsed.response;
          suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [];
        }
      } catch (e1) {
        console.warn('⚠️ Strategy 1 failed, trying markdown removal...');
        try {
          // Strategy 2: Remove markdown
          const cleaned = rawResponse.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
          const parsed = JSON.parse(cleaned);
          if (parsed.response) {
            responseText = parsed.response;
            suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [];
          }
        } catch (e2) {
          console.warn('⚠️ Strategy 2 failed, trying regex extraction...');
          try {
            // Strategy 3: Extract JSON object
            const match = rawResponse.match(/\{[\s\S]*\}/);
            if (match) {
              const parsed = JSON.parse(match[0]);
              if (parsed.response) {
                responseText = parsed.response;
                suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [];
              }
            }
          } catch (e3) {
            // Strategy 4: Use raw text as fallback
            console.error('❌ All JSON parsing strategies failed');
            console.error('Raw response:', rawResponse);
            responseText = rawResponse.length > 500 ? rawResponse.substring(0, 500) + '...' : rawResponse;
          }
        }
      }

      // Save messages
      await ChatMessage.create({ user: userId, role: 'user', content: message });
      await ChatMessage.create({ user: userId, role: 'assistant', content: responseText });

      console.log('💬 Response sent to client');
      res.json({ response: responseText, suggestions });
    } catch (err) {
      console.error('❌ Chat AI error:', err.message);
      
      // Catch Gemini Rate Limit (429) errors specifically
      if (err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('Too Many Requests')) {
        return res.status(429).json({ 
          error: 'You are sending messages too quickly! Please wait about 30 seconds and try again.' 
        });
      }

      res.status(500).json({ 
        error: 'AI service temporarily unavailable', 
        message: err.message 
      });
    }
  } catch (err) {
    console.error('❌ Controller error:', err);
    next(err);
  }
}

export async function getHistory(req, res, next) {
  try {
    const messages = await ChatMessage.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ messages: messages.reverse() });
  } catch (err) {
    next(err);
  }
}

export async function clearHistory(req, res, next) {
  try {
    await ChatMessage.deleteMany({ user: req.user._id });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
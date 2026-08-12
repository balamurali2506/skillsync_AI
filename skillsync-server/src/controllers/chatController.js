import OpenAI from 'openai';
import ChatMessage from '../models/ChatMessage.js';
import Resume from '../models/Resume.js';

const groq = process.env.GROQ_API_KEY ? new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
}) : null;

export async function chat(req, res, next) {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });

    // Save user message
    await ChatMessage.create({ user: req.user._id, role: 'user', content: message });

    // Build personalized context
    const history = await ChatMessage.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(10);
    const context = history.reverse().map((m) => ({ role: m.role, content: m.content }));

    const resume = await Resume.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    const u = req.user;

    const systemPrompt = `You are SkillSync AI, a friendly career assistant.
Candidate profile: ${u.name}, targeting ${u.targetRole || 'Software Engineer'}, ${u.experienceLevel || 'Fresher'}, ${u.university || 'university student'}, graduating ${u.graduationYear || 'soon'}.
Known skills: ${resume?.extractedSkills?.join(', ') || 'not analyzed yet'}.
Give concise (under 150 words), practical, encouraging career advice.`;

    let replyText;

    if (groq) {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 600,
        messages: [{ role: 'system', content: systemPrompt }, ...context],
      });
      replyText = response.choices[0].message.content;
    } else {
      replyText = `Great question! Based on your profile as an aspiring ${u.targetRole || 'engineer'}, I'd recommend focusing on building 2-3 strong projects and practicing DSA consistently. Want me to suggest a learning path?`;
    }

    const assistantMsg = await ChatMessage.create({ user: req.user._id, role: 'assistant', content: replyText });
    res.status(201).json(assistantMsg);
  } catch (err) { next(err); }
}

export async function history(req, res, next) {
  try {
    const messages = await ChatMessage.find({ user: req.user._id }).sort({ createdAt: 1 }).limit(50);
    res.json({ messages });
  } catch (err) { next(err); }
}
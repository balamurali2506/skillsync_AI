import User from '../models/User.js';

export async function updateAIPreferences(req, res, next) {
  try {
    const { geminiKey } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.aiPreferences) user.aiPreferences = {};
    if (geminiKey !== undefined) user.aiPreferences.geminiKey = geminiKey;
    
    user.markModified('aiPreferences');
    await user.save();

    res.json({ hasKey: !!user.aiPreferences.geminiKey });
  } catch (err) { next(err); }
}

export async function getAIPreferences(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    res.json({ hasKey: !!user.aiPreferences?.geminiKey });
  } catch (err) { next(err); }
}

export async function testAIKey(req, res) {
  try {
    const { apiKey } = req.body;
    if (!apiKey?.trim()) return res.status(400).json({ success: false, error: 'No API key provided.' });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: "Say only: Connection successful" }] }] })
    });

    const data = await response.json();
    if (!response.ok) throw { status: response.status, message: data?.error?.message };

    res.json({ success: true, message: data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Connection successful' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message || 'Connection failed.' });
  }
}
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Feedback = require('../models/Feedback');
const SkinImage = require('../models/SkinImage');
const OpenAI = require('openai');

// ---------- AI Client Initialization (auto-detect Groq vs OpenAI) ----------
let aiClient = null;
let aiProvider = 'none';
const apiKey = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;

if (apiKey) {
  // Detect Groq key (starts with 'gsk_')
  if (apiKey.startsWith('gsk_')) {
    aiClient = new OpenAI({
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey: apiKey,
    });
    aiProvider = 'groq';
    console.log('Using Groq API for health tips');
  } else {
    aiClient = new OpenAI({ apiKey: apiKey });
    aiProvider = 'openai';
    console.log('Using OpenAI API for health tips');
  }
} else {
  console.warn('No AI API key – using fallback tips');
}

// @desc    Get personalized health tip for patient
// @route   GET /api/patient/tip
// @access  Private (patient)
const getPersonalizedTip = async (req, res) => {
  try {
    const patientId = req.user._id;

    // Fetch recent data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const appointments = await Appointment.find({
      patient: patientId,
      date: { $gte: thirtyDaysAgo }
    }).populate('doctor', 'specialization name');

    const skinScans = await SkinImage.find({
      user: patientId,
      createdAt: { $gte: thirtyDaysAgo }
    });

    const feedbacks = await Feedback.find({
      patient: patientId,
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Build context for AI
    let context = `Patient ${req.user.name} has:\n`;
    if (appointments.length) {
      context += `- ${appointments.length} recent appointments with doctors specializing in: ${appointments.map(a => a.doctor?.specialization || 'general medicine').join(', ')}\n`;
    }
    if (skinScans.length) {
      const analysisText = skinScans.map(s => s.analysisResult || 'no analysis').join('; ');
      context += `- Skin scan analysis: ${analysisText}\n`;
    }
    if (feedbacks.length) {
      const avgRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;
      context += `- Average feedback rating: ${avgRating.toFixed(1)}/5\n`;
    }

    if (!appointments.length && !skinScans.length && !feedbacks.length) {
      context = "The patient has no recent activity. Provide a general wellness tip.";
    }

    const prompt = `You are a friendly health assistant. Based on the following patient data, generate ONE short, personalized health tip (max 30 words). Be positive and actionable. Do not include disclaimers or markdown.\n\nPatient data:\n${context}\n\nTip:`;

    let tip = "Stay hydrated and take short breaks to move around – your body will thank you!";
    if (aiClient) {
      try {
        const model = aiProvider === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-3.5-turbo';
        const completion = await aiClient.chat.completions.create({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 60,
          temperature: 0.7,
        });
        tip = completion.choices[0].message.content.trim();
        console.log('AI tip generated successfully using', aiProvider);
      } catch (err) {
        console.error('AI tip generation failed:', err.message);
        // fallback tip already set
      }
    }

    res.json({ tip });
  } catch (error) {
    console.error('Tip error:', error);
    res.status(500).json({ message: 'Could not generate tip' });
  }
};

module.exports = { getPersonalizedTip };
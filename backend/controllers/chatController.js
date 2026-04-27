const Chat = require('../models/Chat');
const Appointment = require('../models/Appointment');
const Feedback = require('../models/Feedback');
const SkinImage = require('../models/SkinImage');
const User = require('../models/User');
const OpenAI = require('openai');

// ---------- AI Client Initialization ----------
let aiClient = null;
const AI_PROVIDER = process.env.AI_PROVIDER || 'openai'; // 'groq' or 'openai'

if (AI_PROVIDER === 'groq' && process.env.GROQ_API_KEY) {
  aiClient = new OpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY,
  });
  console.log('Using Groq API for chatbot');
} else if (process.env.OPENAI_API_KEY) {
  aiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  console.log('Using OpenAI API for chatbot');
} else {
  console.warn('No AI API key – using fallback responses.');
}

// ---------- Helper Functions ----------
const getPatientContext = async (patientId) => {
  try {
    const appointments = await Appointment.find({ patient: patientId })
      .populate('doctor', 'name')
      .sort({ date: -1 })
      .limit(10);
    const feedbacks = await Feedback.find({ patient: patientId })
      .populate('appointment', 'doctor date')
      .sort({ createdAt: -1 })
      .limit(5);
    const scans = await SkinImage.find({ user: patientId })
      .sort({ createdAt: -1 })
      .limit(5);
    const patient = await User.findById(patientId).select('name');
    return { appointments, feedbacks, scans, patient };
  } catch (err) {
    console.error('Error fetching patient context:', err);
    return { appointments: [], feedbacks: [], scans: [], patient: null };
  }
};

const formatContextForAI = (patientData) => {
  let context = `Patient name: ${patientData.patient?.name || 'Unknown'}\n`;
  context += "Recent appointments:\n";
  if (patientData.appointments.length) {
    patientData.appointments.forEach(apt => {
      const doctorName = apt.doctor?.name || 'Unknown Doctor';
      context += `- ${new Date(apt.date).toLocaleString()}: Dr. ${doctorName}, status: ${apt.status}\n`;
    });
  } else {
    context += "- No appointments found.\n";
  }
  context += "\nRecent feedback:\n";
  if (patientData.feedbacks.length) {
    patientData.feedbacks.forEach(fb => {
      const doctorName = fb.appointment?.doctor?.name || 'Unknown Doctor';
      const dateStr = fb.appointment?.date ? new Date(fb.appointment.date).toLocaleDateString() : 'unknown date';
      context += `- ${new Date(fb.createdAt).toLocaleDateString()}: rating ${fb.rating} for Dr. ${doctorName} (appointment on ${dateStr}), comment: ${fb.comment || 'none'}\n`;
    });
  } else {
    context += "- No feedback given.\n";
  }
  context += "\nRecent skin scans:\n";
  if (patientData.scans.length) {
    patientData.scans.forEach(scan => {
      context += `- ${new Date(scan.createdAt).toLocaleDateString()}: ${scan.analysisResult || 'No analysis'}\n`;
    });
  } else {
    context += "- No skin scans uploaded.\n";
  }
  return context;
};

// Enhanced fallback with friendly conversation
const getFallbackResponse = (message, patientData) => {
  const msg = message.toLowerCase().trim();
  const { appointments, feedbacks, scans } = patientData;

  // Greetings & Small Talk
  if (msg.match(/^(hi|hello|hey|greetings)/)) {
    return "Hello! I'm your hospital assistant. How can I help you today?";
  }
  if (msg.match(/^(how are you|how are you doing|how's it going)/)) {
    return "I'm doing great, thank you! How can I assist you today?";
  }
  if (msg.match(/^(what's your name|who are you|your name)/)) {
    return "I'm your hospital assistant. You can call me MedBot. What can I do for you?";
  }
  if (msg.match(/^(tell me a joke|make me laugh|say something funny)/)) {
    return "Sure! Why did the doctor carry a red pen? In case they needed to draw blood! 😄";
  }
  if (msg.match(/^(thank you|thanks)/)) {
    return "You're welcome! I'm here to help anytime.";
  }
  if (msg.match(/^(bye|goodbye|see you)/)) {
    return "Goodbye! Take care and stay healthy!";
  }

  // Domain‑Specific (Appointments, Feedback, Scans)
  if (msg.includes('appointment') || msg.includes('book') || msg.includes('schedule')) {
    if (appointments.length === 0) {
      return "You don't have any upcoming appointments. You can book one from the Appointments page.";
    }
    const upcoming = appointments.filter(a => new Date(a.date) >= new Date());
    if (upcoming.length) {
      const next = upcoming[0];
      const doctorName = next.doctor?.name || 'the doctor';
      return `Your next appointment is with Dr. ${doctorName} on ${new Date(next.date).toLocaleString()}.`;
    } else {
      const last = appointments[0];
      const doctorName = last.doctor?.name || 'the doctor';
      return `Your last appointment was with Dr. ${doctorName} on ${new Date(last.date).toLocaleString()}. You have no upcoming appointments.`;
    }
  }

  if (msg.includes('feedback') || msg.includes('review') || msg.includes('rating')) {
    if (feedbacks.length === 0) {
      return "You haven't given any feedback yet. After an appointment, you can leave a review.";
    }
    const last = feedbacks[0];
    return `Your last feedback was a ${last.rating}-star rating on ${new Date(last.createdAt).toLocaleDateString()}.${last.comment ? ` You said: "${last.comment}"` : ''}`;
  }

  if (msg.includes('scan') || msg.includes('skin') || msg.includes('image') || msg.includes('analysis')) {
    if (scans.length === 0) {
      return "You haven't uploaded any skin scans yet. Use the AI Scanner to get a skin analysis.";
    }
    const last = scans[0];
    return `Your latest skin scan was on ${new Date(last.createdAt).toLocaleDateString()}. ${last.analysisResult || 'No analysis saved.'}`;
  }

  if (msg.includes('help') || msg.includes('what can you do')) {
    return "I can help you with:\n- Checking your upcoming appointments\n- Reviewing your past feedback\n- Viewing your skin scan history\n- Answering general health questions\nJust ask me anything!";
  }

  return "I'm sorry, I don't have information about that. For any further assistance, please contact our customer service at +94 76 752 0033.";
};

// ---------- Main Handlers ----------
const sendMessage = async (req, res) => {
  try {
    let { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be a string.' });
    }
    message = message.trim();
    if (message.length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }
    if (message.length > 2000) {
      return res.status(400).json({ error: 'Message too long (max 2000 characters).' });
    }

    const patientId = req.user._id;
    console.log(`[Chat] Request from patient ${patientId}: "${message}"`);

    // Get or create chat document
    let chat = await Chat.findOne({ patient: patientId });
    if (!chat) chat = new Chat({ patient: patientId, messages: [] });

    // Store user message
    chat.messages.push({ role: 'user', content: message });
    await chat.save();

    // Fetch patient context
    const patientData = await getPatientContext(patientId);
    const context = formatContextForAI(patientData);

    let reply = null;

    // Try AI client if available
    if (aiClient) {
      try {
        const systemPrompt = `You are a friendly and helpful hospital assistant for a patient in a hospital management system.
Your goal is to provide warm, empathetic, and accurate answers based on the patient's data and general medical knowledge.
Always use the patient's name if known. Be concise but approachable.

Current patient data:
${context}

Important guidelines:
- **Be conversational**: Greet the user warmly, ask how you can help, and use a friendly tone.
- **Small talk**: If the user asks how you are, say you're doing well and ask how you can help. Tell a light joke if asked.
- **For domain‑specific questions** (appointments, feedback, skin scans): Use the provided data to give personalized answers.
- **For general hospital information** (hours, services, etc.): Provide helpful information if you know it; otherwise redirect to customer service.
- **Out of scope**: If the question is completely unrelated to healthcare or hospital services (e.g., politics, sports, weather), politely say: "I'm sorry, I don't have information about that. For any further assistance, please contact our customer service at +94 76 752 0033."
- **Never give medical advice** beyond general wellness tips.
- Keep responses under 3 sentences unless more detail is needed.`;

        const recentMessages = chat.messages.slice(-10);
        const aiMessages = [
          { role: 'system', content: systemPrompt },
          ...recentMessages.map(m => ({ role: m.role, content: m.content }))
        ];

        const model = AI_PROVIDER === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-3.5-turbo';

        const completion = await aiClient.chat.completions.create({
          model,
          messages: aiMessages,
          max_tokens: 500,
          temperature: 0.7,
        });

        reply = completion.choices[0].message.content.trim();
      } catch (aiError) {
        console.error('[Chat] AI error:', aiError.message);
        reply = getFallbackResponse(message, patientData);
      }
    } else {
      reply = getFallbackResponse(message, patientData);
    }

    // Store assistant reply
    chat.messages.push({ role: 'assistant', content: reply });
    await chat.save();

    res.json({ reply });
  } catch (error) {
    console.error('[Chat] Unhandled error:', error);
    res.status(500).json({ error: 'Failed to process your message. Please try again later.' });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const chat = await Chat.findOne({ patient: req.user._id });
    res.json(chat ? chat.messages : []);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history.' });
  }
};

const deleteChat = async (req, res) => {
  try {
    const result = await Chat.findOneAndDelete({ patient: req.user._id });
    if (!result) return res.status(404).json({ error: 'No chat history found to delete.' });
    res.json({ message: 'Chat history cleared successfully.' });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ error: 'Failed to delete chat history.' });
  }
};

module.exports = { sendMessage, getChatHistory, deleteChat };
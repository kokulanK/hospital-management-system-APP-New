const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { sendMessage, getChatHistory, deleteChat } = require('../controllers/chatController');

const router = express.Router();

// Only patients can use chatbot
router.use(protect, authorize('patient'));

router.post('/', sendMessage);          // Send message
router.get('/history', getChatHistory); // Get chat history
router.delete('/', deleteChat);         // Delete chat

module.exports = router;
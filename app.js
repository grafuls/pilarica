// app.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// WhatsApp API Configuration
const token = process.env.WHATSAPP_TOKEN;
const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
const phoneNumberId = process.env.PHONE_NUMBER_ID;

// Webhook verification endpoint
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const challenge = req.query['hub.challenge'];
  const token = req.query['hub.verify_token'];

  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('Webhook verified');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// Webhook for receiving messages
app.post('/webhook', async (req, res) => {
  try {
    const { body } = req;

    // Check if this is a WhatsApp message
    if (body.object && body.entry && 
        body.entry[0].changes && 
        body.entry[0].changes[0].value.messages) {

      const message = body.entry[0].changes[0].value.messages[0];
      const from = message.from;
      const messageText = message.text?.body;

      if (!messageText) {
        return res.sendStatus(200);
      }

      console.log('Received message:', messageText, 'from:', from);

      // Process the message and prepare response
      let responseText = await processMessage(messageText);

      // Send response back to WhatsApp
      await sendWhatsAppMessage(from, responseText);
      
      res.sendStatus(200);
    } else {
      res.sendStatus(200);
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.sendStatus(500);
  }
});

// Function to process incoming messages
async function processMessage(message) {
  // Convert message to lowercase for easier matching
  const lowerMessage = message.toLowerCase();

  // Basic command handling
  if (lowerMessage.includes('hello')) {
    return 'Hello! How can I help you today?';
  } else if (lowerMessage.includes('help')) {
    return 'Available commands:\n- hello: Get a greeting\n- help: Show this message\n- time: Get current time';
  } else if (lowerMessage.includes('time')) {
    return `Current time is: ${new Date().toLocaleString()}`;
  }

  // Default response
  return 'I received your message. Type "help" to see available commands.';
}

// Function to send messages via WhatsApp API
async function sendWhatsAppMessage(to, message) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: message }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Message sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error.response?.data || error);
    throw error;
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


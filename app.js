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
    console.log("Message received");
    console.log(body);

    // Check if this is a WhatsApp message
    if (body.object && body.entry && 
        body.entry[0].changes && 
        body.entry[0].changes[0].value.messages) {

      const message = body.entry[0].changes[0].value.messages[0];
      const from = message.from;

      // Handle different types of messages
      if (message.type === 'text') {
        const messageText = message.text.body;
        await handleTextMessage(from, messageText);
      } else if (message.type === 'interactive') {
        await handleInteractiveResponse(from, message.interactive);
      }
      
      res.sendStatus(200);
    } else {
      res.sendStatus(200);
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.sendStatus(500);
  }
});

// Handle text messages
async function handleTextMessage(from, messageText) {
  const lowerMessage = messageText.toLowerCase();

  if (lowerMessage === 'menu') {
    await sendListMessage(from);
  } else if (lowerMessage === 'options') {
    await sendButtonMessage(from);
  } else {
    await processMessage(messageText);
  }
}

// Handle interactive responses
async function handleInteractiveResponse(from, interactive) {
  let response = '';
  
  if (interactive.type === 'list_reply') {
    const selectedOption = interactive.list_reply.title;
    response = `You selected: ${selectedOption}. `;
    
    // Handle list selections
    switch(selectedOption) {
      case 'Show Commands':
        response += 'Available commands:\n- menu: Show this menu\n- options: Show quick options\n- help: Get help';
        break;
      case 'Get Time':
        response += `Current time is: ${new Date().toLocaleString()}`;
        break;
      case 'Contact Support':
        response += 'Our support team will contact you shortly.';
        break;
    }
  } else if (interactive.type === 'button_reply') {
    const selectedButton = interactive.button_reply.title;
    response = `You pressed: ${selectedButton}. `;
    
    // Handle button selections
    switch(selectedButton) {
      case 'Yes':
        response += 'Great! How can I help you today?';
        break;
      case 'No':
        response += 'No problem. Let me know if you need anything later!';
        break;
      case 'Maybe':
        response += 'Take your time to decide. I\'ll be here!';
        break;
    }
  }

  await sendWhatsAppMessage(from, response);
}

// Send a list message
async function sendListMessage(to) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'interactive',
        interactive: {
          type: 'list',
          header: {
            type: 'text',
            text: 'Available Options'
          },
          body: {
            text: 'Please select an option from the menu below:'
          },
          footer: {
            text: 'Tap "Menu" to select an option'
          },
          action: {
            button: 'Menu',
            sections: [
              {
                title: 'Information',
                rows: [
                  {
                    id: 'commands',
                    title: 'Show Commands',
                    description: 'Display available commands'
                  },
                  {
                    id: 'time',
                    title: 'Get Time',
                    description: 'Show current time'
                  }
                ]
              },
              {
                title: 'Help',
                rows: [
                  {
                    id: 'support',
                    title: 'Contact Support',
                    description: 'Get help from our team'
                  }
                ]
              }
            ]
          }
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('List message sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending list message:', error.response?.data || error);
    throw error;
  }
}

// Send a button message
async function sendButtonMessage(to) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'interactive',
        interactive: {
          type: 'button',
          header: {
            type: 'text',
            text: 'Quick Response'
          },
          body: {
            text: 'Would you like to proceed?'
          },
          footer: {
            text: 'Choose an option below'
          },
          action: {
            buttons: [
              {
                type: 'reply',
                reply: {
                  id: 'yes',
                  title: 'Yes'
                }
              },
              {
                type: 'reply',
                reply: {
                  id: 'no',
                  title: 'No'
                }
              },
              {
                type: 'reply',
                reply: {
                  id: 'maybe',
                  title: 'Maybe'
                }
              }
            ]
          }
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Button message sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending button message:', error.response?.data || error);
    throw error;
  }
}

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


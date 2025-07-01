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
  await sendInitialMessage(from);
}

async function sendNewPatientMessage(to) {
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
            text: 'Inicio'
          },
          body: {
            text: 'Como te puedo ayudar hoy?'
          },
          footer: {
            text: 'Elija una opción a continuación'
          },
          action: {
            buttons: [
              {
                type: 'reply',
                reply: {
                  id: 'prestaciones',
                  title: 'Consulta de prestaciones'
                }
              },
              {
                type: 'reply',
                reply: {
                  id: 'profesionales',
                  title: 'Listado de profesionales'
                }
              },
              {
                type: 'reply',
                reply: {
                  id: 'horarios',
                  title: 'Horarios de atención'
                }
              },
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

async function sendExistingPatientMessage(from) {
  await sendWhatsAppMessage(from, 'Como te puedo ayudar hoy?');
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
    const selectedButton = interactive.button_reply.id;
    
    // Handle button selections
    switch(selectedButton) {
      case 'nuevo':
        await sendNewPatientMessage(from);
        break;
      case 'existente':
        await sendExistingPatientMessage(from);
        break;
      case 'prestaciones':
        await sendWhatsAppMessage(from, 'Kinesiología, Fonoaudiología, Psicología, Neuropsicología, Neuropsicopedagogía')
        break;
      case 'profesionales':
        await sendWhatsAppMessage(from, 'Dr Este, Dr Aquel')
        break;
      case 'horarios':
        await sendWhatsAppMessage(from, 'Lunes a Viernes de 8:00 a 17:00')
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
async function sendInitialMessage(to) {
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
            text: 'Inicio'
          },
          body: {
            text: 'Hola! Soy Pilarica, el chat bot del Instituto de Neurorehabilitacion Pilar Pacheco. Antes de continuar, que tipo de paciente sos?'
          },
          footer: {
            text: 'Elija una opción a continuación'
          },
          action: {
            buttons: [
              {
                type: 'reply',
                reply: {
                  id: 'nuevo',
                  title: 'Paciente nuevo'
                }
              },
              {
                type: 'reply',
                reply: {
                  id: 'existente',
                  title: 'Paciente existente'
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


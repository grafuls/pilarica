# WhatsApp Bot

A WhatsApp bot built with Node.js and Express, ready for deployment on Render.

## Prerequisites

1. WhatsApp Business API access
2. Meta Developer Account
3. Render account

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   WHATSAPP_TOKEN=your_whatsapp_token_here
   WHATSAPP_VERIFY_TOKEN=your_custom_verify_token_here
   PHONE_NUMBER_ID=your_phone_number_id_here
   ```

## WhatsApp Business API Setup

1. Go to [Meta Developer Portal](https://developers.facebook.com/)
2. Create a new app or use an existing one
3. Add WhatsApp to your app
4. Get your WhatsApp Token and Phone Number ID
5. Set up your webhook URL (your-render-url/webhook)
6. Use your custom Verify Token when setting up the webhook

## Deployment on Render

1. Create a new Web Service on Render
2. Connect your repository
3. Configure the service:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add your environment variables in the Render dashboard
4. Deploy the service

## Available Commands

The bot responds to the following commands:
- `hello`: Get a greeting
- `help`: Show available commands
- `time`: Get current time

## Development

To run the bot locally:
```bash
npm run dev
```

## Health Check

The service includes a health check endpoint at `/health` that returns a 200 status code when the service is running properly. 
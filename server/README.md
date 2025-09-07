# RetroOS Email Backend

A custom Node.js backend service to handle email notifications for the RetroOS portfolio website, replacing third-party services like Formspree.

## Features

- 📧 Custom SMTP email delivery
- 🔒 Security with rate limiting and input validation
- 🎨 Beautiful HTML email templates with retro styling
- 🚀 Easy deployment and configuration
- 📱 CORS support for frontend integration
- 🛡️ Built-in security headers and protection

## Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your email configuration:

```env
# Email Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Where notifications will be sent
RECIPIENT_EMAIL=your-email@gmail.com

# Server Configuration
PORT=3001
NODE_ENV=production

# Frontend domains (comma-separated)
CORS_ORIGIN=http://localhost:3000,https://your-domain.com
```

### 3. Gmail Setup (Recommended)

For Gmail, you'll need to:

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this password in `SMTP_PASS`

### 4. Start the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### POST `/api/send-message`
Send an email notification.

**Request Body:**
```json
{
  "email": "sender@example.com",
  "subject": "Message subject",
  "message": "Message content",
  "name": "Sender Name (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully!",
  "messageId": "unique-message-id"
}
```

### GET `/api/health`
Check if the service is running.

### GET `/api/test-email`
Test email configuration without sending a message.

## Security Features

- **Rate Limiting**: 10 requests per 15 minutes per IP
- **Input Validation**: Joi schema validation
- **CORS Protection**: Configurable allowed origins
- **Security Headers**: Helmet.js protection
- **Error Handling**: Secure error responses

## Email Template

The service sends beautifully formatted emails with:
- Retro-styled HTML design matching your portfolio
- Sender information and timestamp
- Reply-to functionality
- Plain text fallback

## Deployment

### Local Development
The server runs on `http://localhost:3001` by default.

### Production Deployment
1. Set `NODE_ENV=production` in your `.env`
2. Configure your production domain in `CORS_ORIGIN`
3. Use a process manager like PM2:

```bash
npm install -g pm2
pm2 start server.js --name "retro-email"
```

## Troubleshooting

### Common Issues

1. **"Authentication failed"**
   - Check your SMTP credentials
   - For Gmail, ensure you're using an App Password, not your regular password

2. **"Connection refused"**
   - Verify SMTP host and port settings
   - Check if your hosting provider blocks SMTP ports

3. **CORS errors**
   - Add your frontend domain to `CORS_ORIGIN`
   - Ensure the frontend is making requests to the correct backend URL

### Testing

Test the email configuration:
```bash
curl http://localhost:3001/api/test-email
```

Send a test message:
```bash
curl -X POST http://localhost:3001/api/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "subject": "Test Message",
    "message": "This is a test message from RetroOS!"
  }'
```

## Alternative SMTP Providers

Besides Gmail, you can use:

- **SendGrid**: `smtp.sendgrid.net:587`
- **Mailgun**: `smtp.mailgun.org:587`
- **Outlook**: `smtp-mail.outlook.com:587`
- **Yahoo**: `smtp.mail.yahoo.com:587`

Just update the SMTP settings in your `.env` file accordingly.

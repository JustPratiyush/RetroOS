const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const Joi = require('joi');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});

app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Validation schema
const messageSchema = Joi.object({
  email: Joi.string().email().required(),
  subject: Joi.string().min(1).max(200).required(),
  message: Joi.string().min(1).max(5000).required(),
  name: Joi.string().max(100).optional()
});

// Email templates
const createEmailTemplate = (data) => {
  const { email, subject, message, name, timestamp } = data;
  
  return {
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Message from RetroOS Portfolio</title>
        <style>
          body { font-family: 'Courier New', monospace; background-color: #f0f0f0; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border: 2px solid #333; }
          .header { background: #333; color: white; padding: 15px; text-align: center; }
          .content { padding: 20px; line-height: 1.6; }
          .field { margin-bottom: 15px; }
          .label { font-weight: bold; color: #333; }
          .value { background: #f8f8f8; padding: 10px; border: 1px solid #ddd; margin-top: 5px; }
          .message-content { background: #f8f8f8; padding: 15px; border: 1px solid #ddd; white-space: pre-wrap; }
          .footer { background: #f0f0f0; padding: 10px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>📧 New Message from RetroOS Portfolio</h2>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">From:</div>
              <div class="value">${name ? `${name} <${email}>` : email}</div>
            </div>
            <div class="field">
              <div class="label">Subject:</div>
              <div class="value">${subject}</div>
            </div>
            <div class="field">
              <div class="label">Message:</div>
              <div class="message-content">${message}</div>
            </div>
            <div class="field">
              <div class="label">Received:</div>
              <div class="value">${timestamp}</div>
            </div>
          </div>
          <div class="footer">
            <p>This message was sent through your RetroOS portfolio contact form.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
New Message from RetroOS Portfolio
================================

From: ${name ? `${name} <${email}>` : email}
Subject: ${subject}
Received: ${timestamp}

Message:
${message}

---
This message was sent through your RetroOS portfolio contact form.
    `
  };
};

// API Routes
app.post('/api/send-message', async (req, res) => {
  try {
    // Validate input
    const { error, value } = messageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details[0].message
      });
    }

    const { email, subject, message, name } = value;
    const timestamp = new Date().toLocaleString();

    // Create email content
    const emailTemplate = createEmailTemplate({
      email,
      subject,
      message,
      name,
      timestamp
    });

    // Create transporter
    const transporter = createTransporter();

    // Verify transporter configuration
    await transporter.verify();

    // Send email
    const mailOptions = {
      from: `"RetroOS Portfolio" <${process.env.SMTP_USER}>`,
      to: process.env.RECIPIENT_EMAIL,
      subject: `[RetroOS] ${subject}`,
      html: emailTemplate.html,
      text: emailTemplate.text,
      replyTo: email
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`Message sent successfully: ${info.messageId}`);
    console.log(`From: ${email}, Subject: ${subject}`);

    res.status(200).json({
      success: true,
      message: 'Message sent successfully!',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Error sending email:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to send message',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'RetroOS Email Service is running',
    timestamp: new Date().toISOString()
  });
});

// Test email configuration endpoint
app.get('/api/test-email', async (req, res) => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    
    res.status(200).json({
      success: true,
      message: 'Email configuration is valid'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Email configuration failed',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Configuration error'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 RetroOS Email Service running on port ${PORT}`);
  console.log(`📧 SMTP configured for: ${process.env.SMTP_HOST}`);
  console.log(`📬 Notifications will be sent to: ${process.env.RECIPIENT_EMAIL}`);
  console.log('');
  console.log('🔗 Direct Access Links:');
  console.log(`   Health Check: http://localhost:${PORT}/api/health`);
  console.log(`   Email Test:   http://localhost:${PORT}/api/test-email`);
  console.log(`   Frontend:     http://localhost:3000`);
  console.log('');
});

module.exports = app;

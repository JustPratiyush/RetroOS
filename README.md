# RetroOS - Personal Portfolio Website

A nostalgic, retro-styled personal portfolio website that mimics classic operating systems with modern web technologies. Features a fully functional desktop environment with draggable windows, applications, and an organic email contact system.

## 🎯 About This Project

RetroOS is a creative portfolio website designed and developed by **Abhinav Kuchhal** that brings back the charm of vintage operating systems while showcasing modern web development skills. The project features a complete desktop environment with interactive applications, all built using vanilla HTML, CSS, and JavaScript.

### ✨ Key Features

- **Retro Desktop Environment**: Complete OS-like interface with taskbar, desktop icons, and window management
- **Interactive Applications**: Calculator, Clock, Finder, Terminal, Music Player, and more
- **Organic Email System**: Custom-built email backend without third-party dependencies
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Modern Tech Stack**: Built with vanilla web technologies and Node.js backend
- **Vercel Deployment**: Serverless functions for email handling

## 🚀 Live Demo

Visit the live website: [https://abhinavkuchhal.com](https://abhinavkuchhal.com)

## 🛠 Tech Stack

### Frontend
- **HTML5** - Semantic markup and structure
- **CSS3** - Custom styling with retro aesthetics
- **Vanilla JavaScript** - Interactive functionality and DOM manipulation
- **Web APIs** - Battery API, Geolocation, and more

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **Nodemailer** - Email functionality
- **Joi** - Input validation
- **Vercel Serverless Functions** - Production deployment

### Security & Performance
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API protection
- **Input Validation** - Data sanitization

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/JustPratiyush/RetroOS-Personal-Website.git
   cd RetroOS-Personal-Website
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

4. **Configure environment variables**
   ```bash
   # Copy the example environment file
   cp server/.env.example server/.env
   
   # Edit the .env file with your email credentials
   nano server/.env
   ```

5. **Set up your email configuration**
   
   Edit `server/.env` with your SMTP settings:
   ```env
   # Email Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   
   # Recipient Email (where notifications will be sent)
   RECIPIENT_EMAIL=your-email@gmail.com
   
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   
   # Security
   CORS_ORIGIN=http://localhost:3000,https://your-domain.com
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd server
   npm start
   ```
   
   The server will start on `http://localhost:3001` with these endpoints:
   - Health Check: `http://localhost:3001/api/health`
   - Email Test: `http://localhost:3001/api/test-email`
   - Send Message: `http://localhost:3001/api/send-message`

2. **Start the frontend server**
   ```bash
   # In the root directory
   python3 -m http.server 3000
   # or
   npx serve -p 3000
   ```

3. **Access the application**
   
   Open your browser and navigate to `http://localhost:3000`

## 📧 Email System Setup

### Gmail Configuration

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. **Use the App Password** in your `.env` file (not your regular Gmail password)

### Testing Email Functionality

1. Test SMTP configuration: `http://localhost:3001/api/test-email`
2. Send a test email through the contact form
3. Check your configured recipient email for messages

## 🎨 Customization Guide

### Personalizing the Portfolio

1. **Update Personal Information**
   - Edit `index.html` to change name, title, and content
   - Replace profile images in `assets/icons/`
   - Update social media links and contact information

2. **Modify Visual Theme**
   - Edit `css/main.css` for overall styling
   - Customize colors in CSS custom properties
   - Replace wallpapers in `assets/wallpapers/`

3. **Add New Applications**
   - Create new app files in `js/apps/`
   - Add app icons to `assets/icons/`
   - Register the app in `js/main.js`

4. **Customize Desktop Environment**
   - Modify desktop icons and layout
   - Update taskbar applications
   - Change startup behavior and animations

### Email System Customization

1. **Email Templates**
   - Edit templates in `server/server.js` or `api/send-message.js`
   - Customize HTML styling and branding
   - Add additional form fields

2. **Notification System**
   - Modify `js/mail.js` for frontend notifications
   - Customize success/error messages
   - Add sound notifications or animations

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel --prod
   ```

2. **Configure Environment Variables**
   
   In your Vercel dashboard, add these environment variables:
   ```
   SMTP_HOST = smtp.gmail.com
   SMTP_PORT = 587
   SMTP_SECURE = false
   SMTP_USER = your-email@gmail.com
   SMTP_PASS = your-app-password
   RECIPIENT_EMAIL = your-email@gmail.com
   ```

3. **Update CORS Settings**
   
   Add your production domain to the CORS_ORIGIN environment variable.

### Alternative Deployment Options

- **Netlify**: Deploy frontend, use Netlify Functions for backend
- **GitHub Pages**: Frontend only (requires external email service)
- **Heroku**: Full-stack deployment with PostgreSQL add-on
- **DigitalOcean**: VPS deployment with PM2 process manager

## 📁 Project Structure

```
RetroOS-Personal-Website/
├── api/                    # Vercel serverless functions
│   ├── health.js          # Health check endpoint
│   ├── send-message.js    # Email sending functionality
│   └── test-email.js      # SMTP configuration test
├── assets/                # Static assets
│   ├── icons/            # Application and system icons
│   ├── sounds/           # Audio files
│   └── wallpapers/       # Desktop backgrounds
├── css/                   # Stylesheets
│   ├── main.css          # Main styling
│   ├── apps.css          # Application-specific styles
│   └── responsive.css    # Mobile responsiveness
├── js/                    # JavaScript modules
│   ├── apps/             # Individual application logic
│   ├── mail.js           # Email handling
│   ├── main.js           # Core system functionality
│   └── system.js         # System utilities
├── server/                # Backend server (for local development)
│   ├── server.js         # Express server
│   ├── package.json      # Backend dependencies
│   ├── .env.example      # Environment template
│   └── README.md         # Backend documentation
├── index.html            # Main HTML file
├── package.json          # Frontend dependencies
└── README.md             # This file
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines

1. Follow existing code style and conventions
2. Test your changes thoroughly
3. Update documentation as needed
4. Ensure responsive design compatibility
5. Maintain retro aesthetic consistency

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

**Abhinav Kuchhal**
- Portfolio: [https://abhinavkuchhal.com](https://abhinavkuchhal.com)
- GitHub: [@JustPratiyush](https://github.com/JustPratiyush)
- Email: Contact through the portfolio website

## 🙏 Acknowledgments

- Inspired by classic operating systems and retro computing
- Built with modern web standards and best practices
- Thanks to the open-source community for tools and inspiration

---

*RetroOS - Where nostalgia meets modern web development* 🖥️✨
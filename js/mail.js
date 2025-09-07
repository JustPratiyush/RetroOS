// js/mail.js - Email handling for RetroOS

class MailService {
  constructor() {
    this.apiUrl = 'http://localhost:3001/api';
    this.isSubmitting = false;
  }

  async sendMessage(formData) {
    if (this.isSubmitting) {
      throw new Error('Please wait, message is being sent...');
    }

    this.isSubmitting = true;

    try {
      const response = await fetch(`${this.apiUrl}/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    } finally {
      this.isSubmitting = false;
    }
  }

  async testConnection() {
    try {
      const response = await fetch(`${this.apiUrl}/health`);
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Backend connection failed:', error);
      return false;
    }
  }
}

// Initialize mail service
const mailService = new MailService();

// Form submission handler
function initMailForm() {
  const mailForm = document.querySelector('#mail form');
  if (!mailForm) return;

  // Remove the old action and method attributes
  mailForm.removeAttribute('action');
  mailForm.removeAttribute('method');
  mailForm.removeAttribute('enctype');

  mailForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = mailForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
      // Get form data
      const formData = new FormData(mailForm);
      const messageData = {
        email: formData.get('email'),
        subject: formData.get('subject'),
        message: formData.get('message')
      };

      // Validate required fields
      if (!messageData.email || !messageData.subject || !messageData.message) {
        showNotification('Please fill in all required fields.', 'error');
        return;
      }

      // Update button state
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;

      // Send message
      const result = await mailService.sendMessage(messageData);
      
      if (result.success) {
        showNotification('Message sent successfully! I\'ll get back to you soon.', 'success');
        mailForm.reset();
        
        // Close mail window after a short delay
        setTimeout(() => {
          closeWindow('mail');
        }, 2000);
      } else {
        throw new Error(result.error || 'Failed to send message');
      }

    } catch (error) {
      console.error('Mail send error:', error);
      showNotification(
        error.message || 'Failed to send message. Please try again later.',
        'error'
      );
    } finally {
      // Reset button state
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
}

// Notification system
function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll('.mail-notification');
  existingNotifications.forEach(notification => notification.remove());

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `mail-notification mail-notification-${type}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
    color: white;
    padding: 15px 20px;
    border-radius: 4px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 10000;
    font-family: 'VT323', monospace;
    font-size: 16px;
    max-width: 300px;
    word-wrap: break-word;
    animation: slideInRight 0.3s ease-out;
  `;
  
  notification.textContent = message;
  document.body.appendChild(notification);

  // Auto remove after 5 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease-in';
    setTimeout(() => notification.remove(), 300);
  }, 5000);

  // Add click to dismiss
  notification.addEventListener('click', () => {
    notification.style.animation = 'slideOutRight 0.3s ease-in';
    setTimeout(() => notification.remove(), 300);
  });
}

// Add CSS animations
function addNotificationStyles() {
  if (document.getElementById('mail-notification-styles')) return;

  const style = document.createElement('style');
  style.id = 'mail-notification-styles';
  style.textContent = `
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
    
    .mail-notification {
      cursor: pointer;
      transition: transform 0.2s ease;
    }
    
    .mail-notification:hover {
      transform: translateX(-5px);
    }
  `;
  
  document.head.appendChild(style);
}

// Connection status indicator
async function checkBackendStatus() {
  const isConnected = await mailService.testConnection();
  
  if (!isConnected) {
    console.warn('Backend email service is not available. Please start the server.');
    showNotification(
      'Email service is currently offline. Please try again later.',
      'error'
    );
  }
  
  return isConnected;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  addNotificationStyles();
  initMailForm();
  
  // Check backend status when mail window is opened
  const originalOpenWindow = window.openWindow;
  if (originalOpenWindow) {
    window.openWindow = function(windowId) {
      if (windowId === 'mail') {
        setTimeout(checkBackendStatus, 500);
      }
      return originalOpenWindow.apply(this, arguments);
    };
  }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MailService, showNotification };
}

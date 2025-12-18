import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    const {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_SECURE,
      SMTP_USER,
      SMTP_PASSWORD,
      SMTP_FROM_EMAIL,
      SMTP_FROM_NAME
    } = process.env;

    // Check if SMTP is configured
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
      console.warn('⚠️  SMTP not configured. Email functionality will be disabled.');
      this.isConfigured = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT || '587'),
        secure: SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASSWORD
        },
        from: {
          name: SMTP_FROM_NAME || 'ECMS Portal',
          address: SMTP_FROM_EMAIL || SMTP_USER
        }
      });

      this.isConfigured = true;
      console.log('✅ Email service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.error('Email service is not configured. Cannot send email.');
      return false;
    }

    try {
      const mailOptions = {
        from: {
          name: process.env.SMTP_FROM_NAME || 'ECMS Portal',
          address: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || ''
        },
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, '') // Strip HTML for text version
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('📧 Email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  async sendOTPEmail(email: string, otp: string, userName?: string): Promise<boolean> {
    const subject = 'Password Reset OTP - ECMS Portal';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .content {
            background: white;
            padding: 30px;
            border-radius: 8px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #667eea;
            margin: 0;
            font-size: 28px;
          }
          .otp-box {
            background: #f7fafc;
            border: 2px dashed #667eea;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
          }
          .otp-code {
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #667eea;
            font-family: 'Courier New', monospace;
          }
          .info-box {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .info-box p {
            margin: 5px 0;
            font-size: 14px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #718096;
            font-size: 12px;
          }
          .security-note {
            background: #fee;
            border-left: 4px solid #f56565;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 13px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            
            <p>Hello${userName ? ` ${userName}` : ''},</p>
            
            <p>We received a request to reset your password. Use the OTP code below to complete the password reset process:</p>
            
            <div class="otp-box">
              <div style="color: #718096; font-size: 14px; margin-bottom: 10px;">Your OTP Code</div>
              <div class="otp-code">${otp}</div>
            </div>
            
            <div class="info-box">
              <p><strong>⏰ This code will expire in 10 minutes.</strong></p>
              <p>Do not share this code with anyone.</p>
            </div>
            
            <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns about your account security.</p>
            
            <div class="security-note">
              <strong>🛡️ Security Reminder:</strong>
              <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                <li>Never share your OTP with anyone</li>
                <li>We will never ask for your password via email</li>
                <li>Always verify the sender's email address</li>
              </ul>
            </div>
            
            <div class="footer">
              <p>This is an automated email from ECMS Portal</p>
              <p>If you need assistance, please contact your system administrator</p>
              <p style="margin-top: 10px;">&copy; ${new Date().getFullYear()} Education Center Management System</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({ to: email, subject, html });
  }

  async sendPasswordResetSuccessEmail(email: string, userName?: string): Promise<boolean> {
    const subject = 'Password Successfully Reset - ECMS Portal';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .content {
            background: white;
            padding: 30px;
            border-radius: 8px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .success-icon {
            font-size: 64px;
            margin-bottom: 20px;
          }
          .header h1 {
            color: #48bb78;
            margin: 0;
            font-size: 28px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #718096;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <div class="header">
              <div class="success-icon">✅</div>
              <h1>Password Reset Successful</h1>
            </div>
            
            <p>Hello${userName ? ` ${userName}` : ''},</p>
            
            <p>Your password has been successfully reset. You can now log in to your account using your new password.</p>
            
            <p>If you did not make this change or if you believe an unauthorized person has accessed your account, please contact support immediately.</p>
            
            <p style="margin-top: 30px;">
              <strong>Login URL:</strong><br>
              <a href="${process.env.APP_URL || 'http://localhost:5000'}/login" style="color: #667eea; text-decoration: none;">
                ${process.env.APP_URL || 'http://localhost:5000'}/login
              </a>
            </p>
            
            <div class="footer">
              <p>This is an automated email from ECMS Portal</p>
              <p>&copy; ${new Date().getFullYear()} Education Center Management System</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({ to: email, subject, html });
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection verified');
      return true;
    } catch (error) {
      console.error('❌ SMTP connection failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();

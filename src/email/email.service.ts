import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import { Transporter } from "nodemailer";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get("SMTP_HOST"),
      port: this.configService.get("SMTP_PORT"),
      secure: this.configService.get("SMTP_SECURE") === "true",
      auth: {
        user: this.configService.get("SMTP_USER"),
        pass: this.configService.get("SMTP_PASSWORD"),
      },
      // Add connection timeout settings
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,   // 10 seconds
      socketTimeout: 30000,     // 30 seconds
      // Enable connection pooling for better performance
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      // TLS settings for better compatibility
      tls: {
        rejectUnauthorized: false, // Only if using self-signed certs
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    await this.sendEmailWithRetry(options, 3);
  }

  private async sendEmailWithRetry(options: EmailOptions, maxRetries: number): Promise<void> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Verify transporter connection before sending (only on first attempt)
        if (attempt === 1) {
          await this.transporter.verify();
        }

        await this.transporter.sendMail({
          from: this.configService.get("EMAIL_FROM"),
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        });
        console.log(`Email sent successfully to ${options.to} (attempt ${attempt})`);
        return;
      } catch (error) {
        lastError = error as Error;

        // Don't retry on authentication errors or invalid addresses
        if (error.code === 'EAUTH' || error.code === 'ENOTFOUND') {
          console.error(`Fatal email error (no retry): ${error.message}`);
          throw new Error(`Failed to send email: ${error instanceof Error ? error.message : error}`);
        }

        if (attempt === maxRetries) break;

        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        console.log(`Email send attempt ${attempt} failed, retrying in ${delay}ms... Error: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    console.error("Error sending email:", {
        to: options.to,
        subject: options.subject,
        error: lastError instanceof Error ? lastError.message : lastError,
        stack: lastError instanceof Error ? lastError.stack : undefined,
        code: (lastError as any)?.code,
        response: (lastError as any)?.response,
        responseCode: (lastError as any)?.responseCode,
      });
    throw new Error(`Failed to send email after ${maxRetries} attempts: ${lastError?.message}`);
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${this.configService.get("BACKEND_URL")}/api/v1/auth/verify-email/${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #667eea;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #888;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Verify Your Email</h1>
            </div>
            <div class="content">
              <p>Hello!</p>
              <p>Thank you for registering. Please click the button below to verify your email address:</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
              <p>This link will expire in 24 hours.</p>
              <p>If you didn't create an account, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: "Verify Your Email Address",
      html,
      text: `Please verify your email by clicking this link: ${verificationUrl}`,
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.configService.get("FRONTEND_URL")}/reset-password?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #f5576c;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffc107;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #888;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Reset Your Password</h1>
            </div>
            <div class="content">
              <p>Hello!</p>
              <p>We received a request to reset your password. Click the button below to reset it:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #f5576c;">${resetUrl}</p>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <p>This password reset link will expire in 1 hour.</p>
                <p>If you didn't request a password reset, please ignore this email and ensure your account is secure.</p>
              </div>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: "Reset Your Password",
      html,
      text: `Reset your password by clicking this link: ${resetUrl}`,
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #888;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome! 🎉</h1>
            </div>
            <div class="content">
              <p>Hello ${name}!</p>
              <p>Welcome to our platform! Your email has been successfully verified.</p>
              <p>You can now enjoy all the features of your account.</p>
              <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
              <p>Best regards,<br>The Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: "Welcome to Our Platform!",
      html,
      text: `Welcome ${name}! Your email has been verified successfully.`,
    });
  }
}

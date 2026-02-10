#!/usr/bin/env node

/**
 * Email Service Diagnostic Script
 * Run this in production to test SMTP connectivity and configuration
 */

const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('=== Email Service Diagnostic ===\n');

  // Get configuration from environment
  const config = {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
    from: process.env.EMAIL_FROM,
  };

  console.log('Current Configuration:');
  console.log(`  SMTP_HOST: ${config.host || 'NOT SET'}`);
  console.log(`  SMTP_PORT: ${config.port || 'NOT SET'}`);
  console.log(`  SMTP_SECURE: ${config.secure}`);
  console.log(`  SMTP_USER: ${config.user ? 'SET' : 'NOT SET'}`);
  console.log(`  SMTP_PASSWORD: ${config.pass ? 'SET' : 'NOT SET'}`);
  console.log(`  EMAIL_FROM: ${config.from || 'NOT SET'}`);
  console.log('');

  // Validate required fields
  const missingFields = [];
  if (!config.host) missingFields.push('SMTP_HOST');
  if (!config.port) missingFields.push('SMTP_PORT');
  if (!config.user) missingFields.push('SMTP_USER');
  if (!config.pass) missingFields.push('SMTP_PASSWORD');
  if (!config.from) missingFields.push('EMAIL_FROM');

  if (missingFields.length > 0) {
    console.error('❌ Missing required environment variables:', missingFields.join(', '));
    process.exit(1);
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    // Enable debug logging
    logger: true,
    debug: true,
  });

  try {
    console.log('1. Testing SMTP connection...');
    await transporter.verify();
    console.log('   ✓ SMTP connection verified successfully\n');

    console.log('2. Sending test email...');
    const testEmail = config.user; // Send to self for testing
    
    const result = await transporter.sendMail({
      from: config.from,
      to: 'karthiktumala143@gmail.com',
      subject: 'Test Email from Auth Service',
      text: 'This is a test email to verify SMTP configuration is working correctly.',
      html: '<p>This is a test email to verify SMTP configuration is working correctly.</p>',
    });

    console.log('   ✓ Email sent successfully!');
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   Response: ${result.response}`);
    console.log('\n✅ All tests passed! Email service is working correctly.');

  } catch (error) {
    console.error('\n❌ Error during email test:');
    console.error(`   Code: ${error.code}`);
    console.error(`   Response: ${error.response}`);
    console.error(`   Response Code: ${error.responseCode}`);
    console.error(`   Command: ${error.command}`);
    console.error(`   Message: ${error.message}`);
    
    if (error.code === 'EAUTH') {
      console.error('\n🔐 Authentication Error - Common causes:');
      console.error('   - Invalid SMTP credentials (username/password)');
      console.error('   - Gmail: Need to use App Password (2FA enabled)');
      console.error('   - Gmail: Allow "Less secure app access" or confirm sign-in attempt');
      console.error('   - Check Gmail security alerts at: https://myaccount.google.com/security');
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      console.error('\n🌐 Network Error - Common causes:');
      console.error('   - Firewall blocking outbound SMTP (ports 587/465)');
      console.error('   - SMTP server unreachable from this network');
      console.error('   - Check cloud provider security groups/firewall rules');
    } else if (error.code === 'ENOTFOUND') {
      console.error('\n🔍 DNS Error - Common causes:');
      console.error('   - Invalid SMTP_HOST value');
      console.error('   - DNS resolution issues');
    }
    
    process.exit(1);
  }
}

testEmail().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});

// src/services/sms.service.js

const axios = require('axios');

/**
 * Send OTP SMS using MSG91
 *
 * Required .env variables:
 * MSG91_AUTH_KEY=your_msg91_auth_token
 * MSG91_TEMPLATE_ID=your_msg91_template_id
 *
 * Template Example:
 * "Your Kisan Sahayak OTP is ##OTP##. Valid for 10 minutes. Do not share it with anyone."
 */
const sendOtpSms = async (mobile, otp) => {
  try {
    // Check if MSG91 credentials are configured
    if (
      !process.env.MSG91_AUTH_KEY ||
      !process.env.MSG91_TEMPLATE_ID
    ) {
      console.log('====================================');
      console.log('📱 SMS OTP (Development Mode)');
      console.log(`Mobile: ${mobile}`);
      console.log(`OTP: ${otp}`);
      console.log(
        'MSG91 credentials not found in .env, so SMS was not sent.'
      );
      console.log('====================================');

      return true;
    }

    // Convert Indian numbers like 9876543210 to 919876543210
    let formattedMobile = mobile.toString().trim();

    if (!formattedMobile.startsWith('91')) {
      formattedMobile = `91${formattedMobile}`;
    }

    // MSG91 Send OTP API
    const url = 'https://control.msg91.com/api/v5/otp';

    const payload = {
      template_id: process.env.MSG91_TEMPLATE_ID,
      mobile: formattedMobile,
      otp: otp.toString(),
    };

    const headers = {
      authkey: process.env.MSG91_AUTH_KEY,
      'Content-Type': 'application/json',
    };

    const response = await axios.post(url, payload, { headers });

    console.log('====================================');
    console.log('📱 SMS sent successfully via MSG91');
    console.log(`Mobile: ${formattedMobile}`);
    console.log('Response:', response.data);
    console.log('====================================');

    return response.data;
  } catch (error) {
    console.error('====================================');
    console.error('❌ MSG91 SMS Error');

    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Message:', error.message);
    }

    console.error('====================================');

    // Throw error so controller can handle it if needed
    throw error;
  }
};

module.exports = {
  sendOtpSms,
};
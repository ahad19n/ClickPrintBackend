const mongoose = require('mongoose');  
const { randomInt } = require('crypto');

// -------------------------------------------------------------------------- //

exports.resp = (res, code, message, data = {}) => {
  return res.status(code).json({
    success: (code >= 200 && code <= 299),
    message,
    data
  })
};

// -------------------------------------------------------------------------- //

exports.isValidE164NoPlus = (number) => {
  return /^[1-9]\d{7,14}$/.test(number);
};

// -------------------------------------------------------------------------- //

exports.generateOtpCode = (length) => {
  let otp = `${randomInt(1, 10)}`;
  for (let i = 1; i < length; i++)
    otp += randomInt(0, 10);
  return otp;
}

// -------------------------------------------------------------------------- //

exports.gracefulShutdown = async (server) => {
  try {
    console.log('[INFO] Attempting to gracefully shut down server');

    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
    console.log('[INFO] Successfully shutdown server');

    await mongoose.connection.close();
    console.log('[INFO] Successfully closed MongoDB connection');

    process.exit(0);
  } catch (err) {
    console.error('[ERROR] Error during server shutdown:', err);
    process.exit(1);
  }
};

// -------------------------------------------------------------------------- //

exports.sendViaNotifyBot = async (number, message) => {
  return await fetch(process.env.NOTIFYBOT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chatId: `${number}@c.us`,
      message
    })
  });
};
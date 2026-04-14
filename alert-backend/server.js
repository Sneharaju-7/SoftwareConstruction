const express = require('express');
const twilio = require('twilio');
require('dotenv').config();
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

app.post('/send-alert', async (req, res) => {
  const { phoneNumber, alertMessage, alertTime } = req.body;

  try {
    await client.messages.create({
      body: `🔔 REMINDER: ${alertMessage}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    res.json({ success: true });
    console.log(`[Twilio Backend] Safely dispatched SMS to ${phoneNumber}`);
  } catch (error) {
    console.error(`[Twilio Backend] Failed: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));

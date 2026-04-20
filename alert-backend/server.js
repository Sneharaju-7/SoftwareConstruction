const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// ─── WhatsApp Client Setup ────────────────────────────────────────────────────
// LocalAuth stores the session so you only scan QR once.
const waClient = new Client({
  authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

let isReady = false;
let qrCodeData = null;

waClient.on('qr', (qr) => {
  qrCodeData = qr;
  isReady = false;
  console.log('\n🔷 Scan the QR code below with WhatsApp to connect:\n');
  qrcode.generate(qr, { small: true });
  console.log('\n(Keep this terminal open. Once scanned you will see "✅ WhatsApp Ready!")\n');
});

waClient.on('ready', () => {
  isReady = true;
  qrCodeData = null;
  console.log('✅ WhatsApp Client is Ready! Messages will be sent automatically.');
});

waClient.on('authenticated', () => {
  console.log('🔐 WhatsApp session authenticated.');
});

waClient.on('auth_failure', (msg) => {
  console.error('❌ WhatsApp auth failure:', msg);
  isReady = false;
});

waClient.on('disconnected', (reason) => {
  console.warn('⚠️  WhatsApp disconnected:', reason);
  isReady = false;
  // Auto-reconnect
  setTimeout(() => waClient.initialize(), 5000);
});

// Start WhatsApp client
waClient.initialize();

// ─── Helper: format phone to WhatsApp chat ID ───────────────────────────────
// WhatsApp chat IDs are like "91XXXXXXXXXX@c.us" (no + prefix)
const formatChatId = (phone) => {
  let digits = phone.replace(/\D/g, '');
  // If it's a 10-digit Indian number, prepend 91
  if (digits.length === 10) digits = `91${digits}`;
  // Remove leading + if present
  digits = digits.replace(/^\+/, '');
  return `${digits}@c.us`;
};

// ─── Routes ──────────────────────────────────────────────────────────────────

// Health + QR status check
app.get('/wa-status', (req, res) => {
  res.json({
    ready: isReady,
    hasQR: !!qrCodeData,
    qr: qrCodeData || null,
  });
});

// Send a WhatsApp message automatically (no user interaction)
app.post('/send-whatsapp', async (req, res) => {
  const { phoneNumber, message } = req.body;

  if (!phoneNumber || !message) {
    return res.status(400).json({ success: false, error: 'phoneNumber and message are required.' });
  }

  if (!isReady) {
    return res.status(503).json({
      success: false,
      error: 'WhatsApp client is not ready yet. Please scan the QR code in the server terminal.',
      needsQR: !!qrCodeData,
    });
  }

  try {
    const chatId = formatChatId(phoneNumber);
    await waClient.sendMessage(chatId, message);
    console.log(`[WhatsApp] ✅ Message sent to ${chatId}`);
    res.json({ success: true });
  } catch (error) {
    console.error('[WhatsApp] ❌ Send failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Legacy endpoint — kept for backward compat, redirects to WhatsApp send
app.post('/send-alert', async (req, res) => {
  const { phoneNumber, alertMessage, alertTime } = req.body;
  const message =
    `🔔 *REMINDER: ${alertMessage}*\n` +
    `Scheduled time: ${alertTime}\n\n` +
    `_Your Health Reminder App_`;

  req.body = { phoneNumber, message };

  // Forward to /send-whatsapp logic
  if (!isReady) {
    return res.status(503).json({
      success: false,
      error: 'WhatsApp client is not ready. Scan the QR in the server terminal first.',
    });
  }
  try {
    const chatId = formatChatId(phoneNumber);
    await waClient.sendMessage(chatId, message);
    console.log(`[WhatsApp] ✅ Alert sent to ${chatId}`);
    res.json({ success: true });
  } catch (error) {
    console.error('[WhatsApp] ❌ Alert failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(3000, () => {
  console.log('🚀 Alert backend running on http://localhost:3000');
  console.log('   Waiting for WhatsApp QR scan...');
});

const fs = require('fs');
const path = require('path');
const http = require('http');
const { MongoClient, ObjectId } = require('mongodb');
const twilio = require('twilio');
loadEnvFiles([
  path.join(__dirname, '.env'),
  path.join(__dirname, 'alert-backend', '.env'),
]);

const PORT = Number(process.env.PORT || 3000);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'greygo';
const ALERT_SWEEP_INTERVAL_MS = 30 * 1000;

let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('[Twilio] Client initialized for WhatsApp reminders');
  } catch(e) {
    console.error('[Twilio] Failed to initialize:', e.message);
  }
}

let mongoClient;
let database;
let alertSweepTimer;
let lastAlertSweepAt = null;

function loadEnvFiles(filePaths) {
  for (const filePath of filePaths) {
    if (!fs.existsSync(filePath)) continue;

    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      const separatorIndex = line.indexOf('=');
      if (separatorIndex === -1) continue;

      const key = line.slice(0, separatorIndex).trim();
      let value = line.slice(separatorIndex + 1).trim();
      value = value.replace(/^['"]|['"]$/g, '');

      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  }
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error('Request body is too large.'));
        req.destroy();
      }
    });

    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON payload.'));
      }
    });

    req.on('error', reject);
  });
}

function normalizePhoneNumber(phoneNumber) {
  const digitsOnly = String(phoneNumber || '').replace(/[^\d+]/g, '').trim();
  const trimmed = digitsOnly.startsWith('+') ? digitsOnly : digitsOnly.replace(/^\+?/, '');
  if (!trimmed) return '';
  if (trimmed.startsWith('+')) return trimmed;
  if (trimmed.length === 10) return `+91${trimmed}`;
  return `+${trimmed}`;
}

function normalizeUsername(username) {
  return String(username || '').trim();
}

function getDatabase() {
  if (!database) {
    throw new Error('MongoDB is not connected yet.');
  }

  return database;
}

async function connectToMongo() {
  if (database) return database;

  mongoClient = new MongoClient(MONGODB_URI);
  await mongoClient.connect();
  database = mongoClient.db(MONGODB_DB_NAME);

  await Promise.all([
    database.collection('users').createIndex({ usernameLower: 1 }, { unique: true }),
    database.collection('users').createIndex({ phoneNumber: 1 }, { unique: true }),
    database.collection('alerts').createIndex({ userPhoneNumber: 1, status: 1 }),
    database.collection('alerts').createIndex({ nextTriggerAt: 1, status: 1 }),
    database.collection('contacts').createIndex({ userPhoneNumber: 1 }),
  ]);

  return database;
}

function parseAlertType(rawType) {
  const normalized = String(rawType || '').trim().toLowerCase();
  if (normalized === 'medicine') return 'Medicine';
  if (normalized === 'doctor') return 'Doctor';
  if (normalized === 'family') return 'Family';
  throw new Error('type must be Medicine, Doctor, or Family.');
}

function parseTimeParts(timeLabel) {
  const match = String(timeLabel || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?$/);
  if (!match) {
    throw new Error('time must look like 10:00 AM or 18:30.');
  }

  let [, hourRaw, minuteRaw, meridiem] = match;
  let hours = Number(hourRaw);
  const minutes = Number(minuteRaw);

  if (Number.isNaN(hours) || Number.isNaN(minutes) || minutes > 59 || hours > 23 || hours < 0) {
    throw new Error('time is invalid.');
  }

  if (meridiem) {
    if (hours < 1 || hours > 12) {
      throw new Error('time is invalid.');
    }

    const lowerMeridiem = meridiem.toLowerCase();
    if (lowerMeridiem === 'pm' && hours < 12) hours += 12;
    if (lowerMeridiem === 'am' && hours === 12) hours = 0;
  }

  return { hours, minutes };
}

function getTodayAtTime(timeLabel) {
  const { hours, minutes } = parseTimeParts(timeLabel);
  const now = new Date();
  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);
  return target;
}

function getNextDailyOccurrence(timeLabel, fromDate = new Date()) {
  const { hours, minutes } = parseTimeParts(timeLabel);
  const target = new Date(fromDate);
  target.setHours(hours, minutes, 0, 0);

  if (target <= fromDate) {
    target.setDate(target.getDate() + 1);
  }

  return target;
}

function buildReminderMessage(alert) {
  return `Reminder: ${alert.title}${alert.timeLabel ? ` at ${alert.timeLabel}` : ''}`;
}

function buildWhatsAppDeepLink(phoneNumber, message) {
  const digits = normalizePhoneNumber(phoneNumber).replace(/[^\d]/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function serializeUser(user) {
  if (!user) return null;

  return {
    id: user._id.toString(),
    username: user.username,
    phoneNumber: user.phoneNumber,
    profilePicture: user.profilePicture || '',
    createdAt: user.createdAt ? user.createdAt.toISOString() : null,
    updatedAt: user.updatedAt ? user.updatedAt.toISOString() : null,
  };
}

function serializeAlert(alert) {
  const message = buildReminderMessage(alert);

  return {
    id: alert._id.toString(),
    title: alert.title,
    type: alert.type,
    time: alert.timeLabel,
    userPhoneNumber: alert.userPhoneNumber,
    scheduleKind: alert.scheduleKind,
    status: alert.status,
    nextTriggerAt: alert.nextTriggerAt ? alert.nextTriggerAt.toISOString() : null,
    lastTriggeredAt: alert.lastTriggeredAt ? alert.lastTriggeredAt.toISOString() : null,
    completedAt: alert.completedAt ? alert.completedAt.toISOString() : null,
    whatsappLink: buildWhatsAppDeepLink(alert.userPhoneNumber, message),
    message,
    createdAt: alert.createdAt ? alert.createdAt.toISOString() : null,
    updatedAt: alert.updatedAt ? alert.updatedAt.toISOString() : null,
  };
}

function serializeContact(contact) {
  return {
    id: contact._id.toString(),
    name: contact.name,
    phone: contact.phone,
    relation: contact.relation,
    userPhoneNumber: contact.userPhoneNumber,
    createdAt: contact.createdAt ? contact.createdAt.toISOString() : null,
    updatedAt: contact.updatedAt ? contact.updatedAt.toISOString() : null,
  };
}

async function createUser({ username, phoneNumber, profilePicture = '' }) {
  const normalizedUsername = normalizeUsername(username);
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

  if (!normalizedUsername || !normalizedPhoneNumber) {
    throw new Error('username and phoneNumber are required.');
  }

  const now = new Date();
  const users = getDatabase().collection('users');
  const existingUser = await users.findOne({
    $or: [{ usernameLower: normalizedUsername.toLowerCase() }, { phoneNumber: normalizedPhoneNumber }],
  });

  if (existingUser) {
    throw new Error('A user with that username or phone number already exists.');
  }

  const newUser = {
    username: normalizedUsername,
    usernameLower: normalizedUsername.toLowerCase(),
    phoneNumber: normalizedPhoneNumber,
    profilePicture: String(profilePicture || ''),
    createdAt: now,
    updatedAt: now,
  };

  const result = await users.insertOne(newUser);
  return users.findOne({ _id: result.insertedId });
}

async function loginUser({ username, phoneNumber }) {
  const normalizedUsername = normalizeUsername(username);
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

  if (!normalizedUsername || !normalizedPhoneNumber) {
    throw new Error('username and phoneNumber are required.');
  }

  const user = await getDatabase().collection('users').findOne({
    usernameLower: normalizedUsername.toLowerCase(),
    phoneNumber: normalizedPhoneNumber,
  });

  if (!user) {
    throw new Error('No existing account matches that username and phone number.');
  }

  return user;
}

async function updateUserProfile({ currentPhoneNumber, username, phoneNumber, profilePicture = '' }) {
  const normalizedCurrentPhone = normalizePhoneNumber(currentPhoneNumber);
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
  const normalizedUsername = normalizeUsername(username);

  if (!normalizedCurrentPhone || !normalizedPhoneNumber || !normalizedUsername) {
    throw new Error('currentPhoneNumber, username, and phoneNumber are required.');
  }

  const users = getDatabase().collection('users');
  const existingUser = await users.findOne({ phoneNumber: normalizedCurrentPhone });
  if (!existingUser) {
    throw new Error('User not found.');
  }

  const conflictingUser = await users.findOne({
    _id: { $ne: existingUser._id },
    $or: [{ usernameLower: normalizedUsername.toLowerCase() }, { phoneNumber: normalizedPhoneNumber }],
  });

  if (conflictingUser) {
    throw new Error('Another account already uses that username or phone number.');
  }

  const now = new Date();
  await users.updateOne(
    { _id: existingUser._id },
    {
      $set: {
        username: normalizedUsername,
        usernameLower: normalizedUsername.toLowerCase(),
        phoneNumber: normalizedPhoneNumber,
        profilePicture: String(profilePicture || ''),
        updatedAt: now,
      },
    }
  );

  if (normalizedCurrentPhone !== normalizedPhoneNumber) {
    await Promise.all([
      getDatabase()
        .collection('alerts')
        .updateMany({ userPhoneNumber: normalizedCurrentPhone }, { $set: { userPhoneNumber: normalizedPhoneNumber } }),
      getDatabase()
        .collection('contacts')
        .updateMany({ userPhoneNumber: normalizedCurrentPhone }, { $set: { userPhoneNumber: normalizedPhoneNumber } }),
    ]);
  }

  return users.findOne({ _id: existingUser._id });
}

async function createAlert(payload) {
  const type = parseAlertType(payload.type);
  const userPhoneNumber = normalizePhoneNumber(payload.userPhoneNumber);
  const title = String(payload.title || '').trim();
  const timeLabel = String(payload.time || '').trim();

  if (!userPhoneNumber || !title || !timeLabel) {
    throw new Error('userPhoneNumber, title, and time are required.');
  }

  const now = new Date();
  const scheduleKind = type === 'Medicine' ? 'daily' : 'one_time';
  const nextTriggerAt =
    scheduleKind === 'daily' ? getNextDailyOccurrence(timeLabel, now) : getTodayAtTime(timeLabel);

  if (scheduleKind === 'one_time' && nextTriggerAt <= now) {
    throw new Error('Doctor and Family alerts must use a future time later today.');
  }

  const alert = {
    userPhoneNumber,
    title,
    type,
    timeLabel,
    scheduleKind,
    status: 'scheduled',
    nextTriggerAt,
    lastTriggeredAt: null,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  const result = await getDatabase().collection('alerts').insertOne(alert);
  return getDatabase().collection('alerts').findOne({ _id: result.insertedId });
}

async function listAlerts(phoneNumber, includeCompleted = false) {
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
  if (!normalizedPhoneNumber) {
    throw new Error('phoneNumber is required.');
  }

  const query = { userPhoneNumber: normalizedPhoneNumber };
  if (!includeCompleted) {
    query.status = 'scheduled';
  }

  return getDatabase()
    .collection('alerts')
    .find(query)
    .sort({ nextTriggerAt: 1, createdAt: -1 })
    .toArray();
}

async function deleteAlert(alertId, phoneNumber) {
  if (!ObjectId.isValid(alertId)) {
    throw new Error('alertId is invalid.');
  }

  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
  if (!normalizedPhoneNumber) {
    throw new Error('phoneNumber is required.');
  }

  const result = await getDatabase().collection('alerts').deleteOne({
    _id: new ObjectId(alertId),
    userPhoneNumber: normalizedPhoneNumber,
  });

  return result.deletedCount > 0;
}

async function listContacts(phoneNumber) {
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
  if (!normalizedPhoneNumber) {
    throw new Error('phoneNumber is required.');
  }

  return getDatabase()
    .collection('contacts')
    .find({ userPhoneNumber: normalizedPhoneNumber })
    .sort({ createdAt: 1 })
    .toArray();
}

async function createContact({ userPhoneNumber, name, phone, relation }) {
  const normalizedOwnerPhone = normalizePhoneNumber(userPhoneNumber);
  const normalizedContactPhone = normalizePhoneNumber(phone);
  const contactName = String(name || '').trim();
  const contactRelation = String(relation || '').trim();

  if (!normalizedOwnerPhone || !normalizedContactPhone || !contactName || !contactRelation) {
    throw new Error('userPhoneNumber, name, phone, and relation are required.');
  }

  const existingContacts = await listContacts(normalizedOwnerPhone);
  if (existingContacts.length >= 5) {
    throw new Error('You can only add up to 5 emergency contacts.');
  }

  const now = new Date();
  const newContact = {
    userPhoneNumber: normalizedOwnerPhone,
    name: contactName,
    phone: normalizedContactPhone,
    relation: contactRelation,
    createdAt: now,
    updatedAt: now,
  };

  const result = await getDatabase().collection('contacts').insertOne(newContact);
  return getDatabase().collection('contacts').findOne({ _id: result.insertedId });
}

async function deleteContact(contactId, phoneNumber) {
  if (!ObjectId.isValid(contactId)) {
    throw new Error('contactId is invalid.');
  }

  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
  if (!normalizedPhoneNumber) {
    throw new Error('phoneNumber is required.');
  }

  const result = await getDatabase().collection('contacts').deleteOne({
    _id: new ObjectId(contactId),
    userPhoneNumber: normalizedPhoneNumber,
  });

  return result.deletedCount > 0;
}

async function runDueAlertSweep() {
  if (!database) return;

  const now = new Date();
  const alerts = await getDatabase()
    .collection('alerts')
    .find({
      status: 'scheduled',
      nextTriggerAt: { $lte: now },
    })
    .toArray();

  for (const alert of alerts) {
    const message = buildReminderMessage(alert);
    const whatsappLink = buildWhatsAppDeepLink(alert.userPhoneNumber, message);

    if (alert.scheduleKind === 'daily') {
      await getDatabase().collection('alerts').updateOne(
        { _id: alert._id },
        {
          $set: {
            lastTriggeredAt: now,
            nextTriggerAt: getNextDailyOccurrence(alert.timeLabel, now),
            lastGeneratedWhatsAppLink: whatsappLink,
            updatedAt: now,
          },
        }
      );
    } else {
      await getDatabase().collection('alerts').updateOne(
        { _id: alert._id },
        {
          $set: {
            status: 'completed',
            completedAt: now,
            lastTriggeredAt: now,
            lastGeneratedWhatsAppLink: whatsappLink,
            updatedAt: now,
          },
        }
      );
    }

    console.log(`[Alert Sweep] Reminder became due for ${alert.userPhoneNumber}: ${message}`);
    console.log(`[Alert Sweep] WhatsApp deep link prepared: ${whatsappLink}`);

    if (twilioClient && process.env.TWILIO_WHATSAPP_NUMBER) {
      try {
        const toWhatsApp = alert.userPhoneNumber.startsWith('whatsapp:')
          ? alert.userPhoneNumber
          : `whatsapp:${normalizePhoneNumber(alert.userPhoneNumber)}`;
        const fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER.startsWith('whatsapp:')
          ? process.env.TWILIO_WHATSAPP_NUMBER
          : `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;
          
        await twilioClient.messages.create({
          body: `🔔 *REMINDER*: ${message}\n\nTap here for details: ${whatsappLink}`,
          from: fromWhatsApp,
          to: toWhatsApp
        });
        console.log(`[Alert Sweep] WhatsApp message dispatched to ${toWhatsApp}`);
      } catch (error) {
        console.error(`[Alert Sweep] Twilio WhatsApp failed for ${alert.userPhoneNumber}: ${error.message}`);
      }
    }
  }

  lastAlertSweepAt = now;
}

function startAlertSweep() {
  if (alertSweepTimer) return;

  alertSweepTimer = setInterval(() => {
    runDueAlertSweep().catch((error) => {
      console.error('[Alert Sweep] Failed:', error.message);
    });
  }, ALERT_SWEEP_INTERVAL_MS);
}

async function requestHandler(req, res) {
  if (!req.url) {
    sendJson(res, 404, { success: false, error: 'Route not found.' });
    return;
  }

  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && requestUrl.pathname === '/health') {
    sendJson(res, 200, {
      ok: true,
      port: PORT,
      database: MONGODB_DB_NAME,
      mongoConnected: Boolean(database),
      lastAlertSweepAt: lastAlertSweepAt ? lastAlertSweepAt.toISOString() : null,
      whatsappDeliveryMode: 'deep_link_only',
    });
    return;
  }

  if (req.method === 'POST' && requestUrl.pathname === '/users/signup') {
    try {
      const { username, phoneNumber, profilePicture } = await readJsonBody(req);
      const user = await createUser({ username, phoneNumber, profilePicture });
      sendJson(res, 201, { success: true, user: serializeUser(user) });
      return;
    } catch (error) {
      const statusCode =
        error.message.includes('required') || error.message.includes('already exists') ? 400 : 500;
      sendJson(res, statusCode, { success: false, error: error.message });
      return;
    }
  }

  if (req.method === 'POST' && requestUrl.pathname === '/users/login') {
    try {
      const { username, phoneNumber } = await readJsonBody(req);
      const user = await loginUser({ username, phoneNumber });
      sendJson(res, 200, { success: true, user: serializeUser(user) });
      return;
    } catch (error) {
      const statusCode =
        error.message.includes('required') || error.message.includes('No existing account') ? 400 : 500;
      sendJson(res, statusCode, { success: false, error: error.message });
      return;
    }
  }

  if (req.method === 'PUT' && requestUrl.pathname === '/users/profile') {
    try {
      const { currentPhoneNumber, username, phoneNumber, profilePicture } = await readJsonBody(req);
      const user = await updateUserProfile({
        currentPhoneNumber,
        username,
        phoneNumber,
        profilePicture,
      });
      sendJson(res, 200, { success: true, user: serializeUser(user) });
      return;
    } catch (error) {
      const statusCode =
        error.message.includes('required') ||
        error.message.includes('already uses') ||
        error.message.includes('not found')
          ? 400
          : 500;
      sendJson(res, statusCode, { success: false, error: error.message });
      return;
    }
  }

  if (req.method === 'POST' && requestUrl.pathname === '/alerts') {
    try {
      const payload = await readJsonBody(req);
      const alert = await createAlert(payload);
      sendJson(res, 201, { success: true, alert: serializeAlert(alert) });
      return;
    } catch (error) {
      const statusCode =
        error.message.includes('required') ||
        error.message.includes('must be') ||
        error.message.includes('invalid') ||
        error.message.includes('future time')
          ? 400
          : 500;
      sendJson(res, statusCode, { success: false, error: error.message });
      return;
    }
  }

  if (req.method === 'GET' && requestUrl.pathname === '/alerts') {
    try {
      const phoneNumber = requestUrl.searchParams.get('phoneNumber') || '';
      const includeCompleted = requestUrl.searchParams.get('includeCompleted') === 'true';
      const alerts = await listAlerts(phoneNumber, includeCompleted);
      sendJson(res, 200, { success: true, alerts: alerts.map(serializeAlert) });
      return;
    } catch (error) {
      const statusCode = error.message.includes('required') ? 400 : 500;
      sendJson(res, statusCode, { success: false, error: error.message });
      return;
    }
  }

  if (req.method === 'DELETE' && requestUrl.pathname.startsWith('/alerts/')) {
    try {
      const alertId = requestUrl.pathname.split('/').pop();
      const phoneNumber = requestUrl.searchParams.get('phoneNumber') || '';
      const deleted = await deleteAlert(alertId, phoneNumber);

      if (!deleted) {
        sendJson(res, 404, { success: false, error: 'Alert not found.' });
        return;
      }

      sendJson(res, 200, { success: true });
      return;
    } catch (error) {
      const statusCode =
        error.message.includes('required') || error.message.includes('invalid') ? 400 : 500;
      sendJson(res, statusCode, { success: false, error: error.message });
      return;
    }
  }

  if (req.method === 'GET' && requestUrl.pathname === '/contacts') {
    try {
      const phoneNumber = requestUrl.searchParams.get('phoneNumber') || '';
      const contacts = await listContacts(phoneNumber);
      sendJson(res, 200, { success: true, contacts: contacts.map(serializeContact) });
      return;
    } catch (error) {
      const statusCode = error.message.includes('required') ? 400 : 500;
      sendJson(res, statusCode, { success: false, error: error.message });
      return;
    }
  }

  if (req.method === 'POST' && requestUrl.pathname === '/contacts') {
    try {
      const payload = await readJsonBody(req);
      const contact = await createContact(payload);
      sendJson(res, 201, { success: true, contact: serializeContact(contact) });
      return;
    } catch (error) {
      const statusCode =
        error.message.includes('required') || error.message.includes('only add up to 5') ? 400 : 500;
      sendJson(res, statusCode, { success: false, error: error.message });
      return;
    }
  }

  if (req.method === 'DELETE' && requestUrl.pathname.startsWith('/contacts/')) {
    try {
      const contactId = requestUrl.pathname.split('/').pop();
      const phoneNumber = requestUrl.searchParams.get('phoneNumber') || '';
      const deleted = await deleteContact(contactId, phoneNumber);

      if (!deleted) {
        sendJson(res, 404, { success: false, error: 'Contact not found.' });
        return;
      }

      sendJson(res, 200, { success: true });
      return;
    } catch (error) {
      const statusCode =
        error.message.includes('required') || error.message.includes('invalid') ? 400 : 500;
      sendJson(res, statusCode, { success: false, error: error.message });
      return;
    }
  }

  sendJson(res, 404, { success: false, error: 'Route not found.' });
}

async function startServer(port = PORT) {
  await connectToMongo();
  startAlertSweep();

  const server = http.createServer((req, res) => {
    requestHandler(req, res).catch((error) => {
      console.error('[Mongo Backend] Unexpected error:', error);
      sendJson(res, 500, { success: false, error: 'Unexpected server error.' });
    });
  });

  server.listen(port, () => {
    console.log(`GreyGo Mongo backend running on port ${port}`);
    console.log(`Connected to MongoDB database "${MONGODB_DB_NAME}"`);
  });

  return server;
}

module.exports = { startServer };

if (require.main === module) {
  startServer();
}

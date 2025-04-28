// 📦 Import modules
const express = require('express');
const axios = require('axios');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');

// 🚀 Setup
const app = express();
app.use(express.json());

// 🗃️ Setup database
const adapter = new JSONFile('./db/users.json');
const db = new Low(adapter);

// ✏️ Your Bot Token
const BOT_TOKEN = '8109496235:AAEK72pVLP6duBLYKAdfGFZRqrEkCZW8uyc'; // <-- Set your bot token here!

// 🌐 Webhook to receive updates
app.post('/webhook', async (req, res) => {
  const update = req.body;
  if (update.message) {
    const chatId = update.message.chat.id;
    await db.read();
    const users = db.data.users || [];
    if (!users.includes(chatId)) {
      users.push(chatId);
      db.data.users = users;
      await db.write();
    }
  }
  res.sendStatus(200);
});

// 📢 Broadcast endpoint
app.post('/broadcast', async (req, res) => {
  const { type, text, photoUrl } = req.body;
  if (!text) return res.json({ status: "❌ Text is required!" });

  await db.read();
  const users = db.data.users || [];

  let success = 0;
  let fail = 0;

  for (const userId of users) {
    try {
      if (type === 'photo' && photoUrl) {
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
          chat_id: userId,
          photo: photoUrl,
          caption: text,
          parse_mode: "HTML"
        });
      } else {
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          chat_id: userId,
          text: text,
          parse_mode: "HTML"
        });
      }
      success++;
    } catch (error) {
      console.error(`Failed to send to ${userId}`, error.message);
      fail++;
    }
  }

  res.json({ status: "✅ Broadcast finished!", success, fail });
});

// ✅ App Running
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

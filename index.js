import express from "express";
import axios from "axios";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

const app = express();
app.use(express.json());

// Initialize database
const adapter = new JSONFile("./db/users.json");
const db = new Low(adapter);

// Important: Set default data if file is empty
await db.read();
db.data ||= { users: [] };
await db.write();

// Telegram Bot Token
const BOT_TOKEN = '8109496235:AAEK72pVLP6duBLYKAdfGFZRqrEkCZW8uyc'; // Replace with your bot token
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Webhook route to collect users
app.post("/webhook", async (req, res) => {
  const message = req.body.message;
  if (message) {
    const userId = message.chat.id;
    if (!db.data.users.includes(userId)) {
      db.data.users.push(userId);
      await db.write();
    }
  }
  res.sendStatus(200);
});

// Broadcast route
app.post("/broadcast", async (req, res) => {
  const { type, text, photoUrl } = req.body;

  if (!type || !text) {
    return res.status(400).json({ message: "Missing type or text" });
  }

  for (const userId of db.data.users) {
    try {
      if (type === "text") {
        await axios.post(`${TELEGRAM_API}/sendMessage`, {
          chat_id: userId,
          text: text,
          parse_mode: "HTML"
        });
      } else if (type === "photo") {
        await axios.post(`${TELEGRAM_API}/sendPhoto`, {
          chat_id: userId,
          photo: photoUrl,
          caption: text,
          parse_mode: "HTML"
        });
      }
    } catch (error) {
      console.error(`Failed to send to ${userId}`, error.message);
    }
  }

  res.json({ message: "Broadcast sent to all users" });
});

// Port from environment
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} 🚀`);
});

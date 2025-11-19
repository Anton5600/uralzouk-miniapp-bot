import TelegramBot from "node-telegram-bot-api";
import express from "express";

const TOKEN = process.env.TOKEN; // Telegram token (из environment)
const WEBAPP_URL = process.env.WEBAPP_URL; // GAS WebApp URL

if (!TOKEN) {
  console.error("ERROR: TOKEN is not set. Set environment variable TOKEN.");
  process.exit(1);
}
if (!WEBAPP_URL) {
  console.error("ERROR: WEBAPP_URL is not set. Set environment variable WEBAPP_URL.");
  process.exit(1);
}

// Создаём бот
const bot = new TelegramBot(TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "Нажмите кнопку ниже, чтобы открыть мини-приложение",
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Открыть",
              web_app: { url: WEBAPP_URL }
            }
          ]
        ]
      }
    }
  );
});

// Поддержка web-интерфейса (для Render keep-alive)
const app = express();
app.get("/", (req, res) => res.send("uralzouk bot is running"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server started on port " + PORT));

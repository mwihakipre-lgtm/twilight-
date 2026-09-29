import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState
} from "@whiskeysockets/baileys";

import { Boom } from "@hapi/boom";

async function startBot() {
  const { state, saveCreds } =
    await useMultiFileAuthState("auth_info");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log("✅ Twilight Bot connected to WhatsApp!");
    }

    if (connection === "close") {
      const shouldReconnect =
        new Boom(lastDisconnect?.error)?.output?.statusCode !==
        DisconnectReason.loggedOut;

      console.log("WhatsApp connection closed.");

      if (shouldReconnect) {
        startBot();
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    for (const message of messages) {
      if (!message.message || message.key.fromMe) continue;

      const jid = message.key.remoteJid;

      const text =
        message.message.conversation ||
        message.message.extendedTextMessage?.text ||
        "";

      if (text.toLowerCase() === "ping") {
        await sock.sendMessage(jid, {
          text: "🏓 Pong! Twilight Bot is alive."
        });
      }

      if (text.toLowerCase() === "menu") {
        await sock.sendMessage(jid, {
          text:
            "🌙 *TWILIGHT BOT*\n\n" +
            "1. ping\n" +
            "2. menu\n\n" +
            "Send *ping* to test the bot."
        });
      }
    }
  });
}

startBot();

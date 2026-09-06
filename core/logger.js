import chalk from "chalk";
import moment from "moment-timezone";

export default async (m) => {
  const gradient = (await import("gradient-string")).default;
  const { vice } = gradient;

  const theme = {
    title: chalk.bold.cyanBright,
    label: chalk.hex("#FFD700").bold,
    value: chalk.whiteBright,
    command: chalk.greenBright,
    msg: chalk.hex("#00FFFF"),
    warn: chalk.redBright,
  };

  const senderNumber = (m.sender || m.jid || "").split("@")[0];
  const pengirim = m.name || senderNumber || "Tidak diketahui";
  const nama = m.name || "Tidak diketahui";
  const tujuan = m.isGroup
    ? "Grup"
    : m.isNewsletter
    ? "Newsletter"
    : "Private";
  const subjek = m.metadata?.subject || "-";
  const id = m.id || "N/A";
  const waktu = moment()
    .tz("Asia/Jakarta")
    .format("D/M/YYYY, HH.mm.ss [WIB]");
  const tipe = m.type || Object.keys(m.message || {})[0] || "Unknown";

  const text =
    m.text ||
    m.message?.conversation ||
    m.message?.extendedTextMessage?.text ||
    m.message?.imageMessage?.caption ||
    "";

  const ukuran = `${text.length} Karakter`;
  const sumber = m.isBot ? "🤖 Bot" : "👤 User";
  const botStatus = m.isBot ? chalk.greenBright("✓") : chalk.redBright("✗");

  const userData = global.db.data.users[m.sender] || {};
  const chatData = global.db.data.chats[m.chat] || {};

  let customPrefix = null;
  if (userData.customPrefix) {
    customPrefix = userData.customPrefix;
  } else if (m.isGroup && chatData.customPrefix) {
    customPrefix = chatData.customPrefix;
  }

  const prefix = customPrefix
    ? (text.startsWith(customPrefix)
        ? customPrefix
        : (/^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/.test(text)
            ? text.match(/^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/gi)[0]
            : null))
    : (/^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/.test(text)
        ? text.match(/^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/gi)[0]
        : null);

  let command = "Tidak ada command";
  if (text && prefix && text.startsWith(prefix)) {
    const args = text.slice(prefix.length).trim().split(/ +/);
    command = args.shift()?.toLowerCase() || "Unknown";
  }

  console.log(vice("──────────────────────────────────────────────"));
  console.log(theme.title("📜 LOG PESAN"));
  console.log(vice("──────────────────────────────────────────────"));

  console.log(`${theme.label("📨 Pengirim:")} ${theme.value(pengirim)}`);
  console.log(`${theme.label("📛 Nama:")} ${theme.value(nama)}`);
  console.log(`${theme.label("🎯 Tujuan:")} ${theme.value(tujuan)}`);
  console.log(`${theme.label("📌 Subjek:")} ${theme.value(subjek)}`);
  console.log(`${theme.label("🆔 ID:")} ${theme.value(id)}`);
  console.log(`${theme.label("🕒 Waktu:")} ${theme.value(waktu)}`);
  console.log(`${theme.label("💬 Tipe:")} ${theme.value(tipe)}`);
  console.log(`${theme.label("📏 Ukuran:")} ${theme.value(ukuran)}`);
  console.log(`${theme.label("🧍 Sumber:")} ${theme.value(sumber)}`);
  console.log(`${theme.label("🤖 Bot:")} ${botStatus}`);
  console.log(`${theme.label("⚙️ Command:")} ${theme.command(command)}`);

  console.log(vice("──────────────────────────────────────────────"));
  console.log(theme.msg(chalk.bold("✉️ Pesan")));
  console.log(theme.msg(text || "Tidak ada isi pesan"));
  console.log(vice("──────────────────────────────────────────────\n"));
};
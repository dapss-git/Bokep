const handler = async (m, { conn, text, args, usedPrefix, command }) => {
  try {
    if (!text) {
      return m.reply(`❌ Usage: ${usedPrefix}remind <minutes>|<message>\n\nExample: ${usedPrefix}remind 5|Take a break!`);
    }

    const parts = text.split('|');
    if (parts.length < 2) {
      return m.reply('❌ Format: minutes|message\nExample: 10|Drink water!');
    }

    const minutes = parseInt(parts[0].trim());
    const message = parts.slice(1).join('|').trim();

    if (isNaN(minutes) || minutes < 1 || minutes > 1440) {
      return m.reply('❌ Minutes must be between 1 and 1440 (24 hours)!');
    }

    const delay = minutes * 60 * 1000;

    m.reply(`✅ Reminder set for ${minutes} minute(s)!\n\n📝 Message: ${message}`);

    setTimeout(async () => {
      await conn.sendMessage(m.chat, {
        text: `⏰ *REMINDER*\n\n📝 ${message}\n\n⏱️ This reminder was set ${minutes} minute(s) ago.`,
        contextInfo: {
          mentionedJid: [m.sender]
        }
      }, { quoted: m });
    }, delay);

  } catch (e) {
    console.error(e);
    m.reply('❌ Error setting reminder!');
  }
};

handler.command = ['remind', 'reminder', 'remindme'];
handler.help = ['remind <minutes>|<message>'];
handler.tags = ['tools'];
handler.exp = 5;
handler.limit = true;

handler.register = true

export default handler;

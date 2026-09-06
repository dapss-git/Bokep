const handler = async (m, { conn, text, args, usedPrefix, command }) => {
  try {
    if (!text) {
      return m.reply(`❌ Usage: ${usedPrefix}bugreport <bug description>\n\nExample: ${usedPrefix}bugreport Menu command not responding`);
    }

    if (text.length < 20) {
      return m.reply('❌ Bug report must be at least 20 characters!');
    }

    const ownerNumbers = global.owner || [];
    const owners = ownerNumbers
      .filter(o => Array.isArray(o) ? o[2] !== false : true)
      .map(o => (Array.isArray(o) ? o[0] : o).replace(/[^0-9]/g, '') + '@s.whatsapp.net');

    const bugReport = `╭───「 *BUG REPORT* 」───⬣
│
│ 🐛 *BUG REPORT*
│
│ 👤 *Reporter:* @${m.sender.split('@')[0]}
│ 📱 *Number:* ${m.sender.split('@')[0]}
│ 💬 *Chat Type:* ${m.isGroup ? 'Group' : 'Private'}
│ ⏰ *Time:* ${new Date().toLocaleString('id-ID')}
│
│ 📋 *Bug Details:*
│ ${text}
│
│ ─────────────────────
│ 📲 *Bot Info:*
│ Name: ${global.botname}
│ Version: ${global.versi}
│
╰─────────────────────⬣`;

    for (const owner of owners) {
      await conn.sendMessage(owner, {
        text: bugReport,
        mentions: [m.sender]
      });
    }

    m.reply(`✅ Bug report sent successfully!\n\n🐛 Thank you for helping improve the bot!\n\n⏳ The development team will review your report.`);

  } catch (e) {
    console.error(e);
    m.reply('❌ Error sending bug report!');
  }
};

handler.command = ['bugreport', 'bug', 'reporterror'];
handler.help = ['bugreport <description>'];
handler.tags = ['info'];
handler.exp = 5;
handler.limit = true;

handler.register = true

export default handler;

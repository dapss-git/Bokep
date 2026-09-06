import moment from 'moment-timezone';

const handler = async (m, {
    conn,
    args,
    usedPrefix,
    command
}) => {
    if (!m.isGroup) return m.reply('Perintah ini hanya bisa digunakan di grup!');

    const action = command.toLowerCase();
    const isOpen = action === 'opengc';

    if (!args[0]) {
        try {
            // Cancel existing schedule if any
            if (global.db.data.chats[m.chat].scheduled) {
                delete global.db.data.chats[m.chat].scheduled;
            }

            await conn.groupSettingUpdate(
                m.chat,
                isOpen ? 'not_announcement' : 'announcement'
            );
            return m.reply(`✅ Group berhasil di-${isOpen ? 'buka' : 'tutup'}!`);
        } catch (e) {
            console.error(e);
            return m.reply('❌ Gagal mengubah setting grup.');
        }
    }

    const timeStr = args[0];
    // Default to daily recurring schedule
    const isOnce = args.some(arg => /sekali|once/i.test(arg));
    const isDaily = !isOnce;
    
    // Filter out 'sekali'/'once' to find timezone if provided
    const timezone = args.find(arg => arg.includes('/') && !/sekali|once/i.test(arg)) || 'Asia/Jakarta';

    const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) {
        return m.reply(`
🕒 *Format waktu tidak valid!*

Gunakan:
${usedPrefix}${command} HH:mm [timezone]

Contoh:
• ${usedPrefix}${command} 20:00
• ${usedPrefix}${command} 08:30 Asia/Jakarta
• ${usedPrefix}${command} 23:00 Asia/Makassar

*Catatan:* Jadwal otomatis berulang setiap hari. Tambahkan kata 'sekali' jika hanya ingin satu kali jalan.
`);
    }

    const hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);

    if (hours > 23 || minutes > 59) {
        return m.reply('⚠️ Waktu tidak valid! (0-23 : 0-59)');
    }

    const now = moment.tz(timezone);
    let target = moment.tz(timezone).set({
        hour: hours,
        minute: minutes,
        second: 0,
        millisecond: 0
    });

    if (target.isBefore(now)) target.add(1, 'day');

    const delay = target.diff(now);

    const actionText = isOpen ? 'buka' : 'tutup';

    // Store schedule in database for persistence
    if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {};
    console.log(`[closegc] Saving ${isDaily ? 'DAILY ' : ''}schedule for ${m.chat}: ${target.valueOf()} (${actionText})`);
    global.db.data.chats[m.chat].scheduled = {
        time: target.valueOf(),
        action: isOpen ? 'open' : 'close',
        isDaily: isDaily
    };

    m.reply(`
⏰ *Jadwal ${actionText.toUpperCase()} GC*

📌 Status: ${isOpen ? 'OPEN' : 'CLOSE'}
🕐 Waktu: ${target.format('HH:mm')} (${timezone})
📅 Tanggal: ${target.format('DD MMMM YYYY')}
⏳ Dalam: ${moment.duration(delay).humanize()}
🔁 Berulang: ${isDaily ? 'Ya (Setiap Hari)' : 'Tidak (Sekali Jalan)'}

Bot akan otomatis ${actionText} grup sesuai jadwal.
`);
};

handler.command = ['closegc', 'opengc'];
handler.tags = ['group'];
handler.help = ['closegc', 'opengc HH:mm'];
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

handler.register = true

export default handler;
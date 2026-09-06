import moment from 'moment-timezone';
import chalk from 'chalk';

const handler = async (m, {
    text,
    usedPrefix,
    command,
    db,
    conn
}) => {
    if (!text && !m.isGroup) {
        return m.reply(
            `Gunakan format:\n` +
            `${usedPrefix + command} (di grup)\n` +
            `${usedPrefix + command} <group_id>\n` +
            `${usedPrefix + command} <linkgrup>\n\n` +
            `Contoh:\n` +
            `${usedPrefix + command}\n` +
            `${usedPrefix + command} 120363422829135355@g.us\n` +
            `${usedPrefix + command} https://chat.whatsapp.com/xxxx`
        );
    }

    let groupId;

    const idMatch = text?.match(/(\d+@g\.us)/i);
    if (idMatch) groupId = idMatch[1];

    if (!groupId && m.isGroup && !text?.includes('chat.whatsapp.com')) {
        groupId = m.chat;
    }

    if (!groupId && text?.includes('chat.whatsapp.com')) {
        const code = text.match(/chat\.whatsapp\.com\/([0-9A-Za-z]+)/i)?.[1];
        if (!code) return m.reply('Link grup tidak valid.');

        try {
            groupId = await conn.groupAcceptInvite(code);
        } catch {
            return m.reply('Gagal mengambil ID grup dari link.');
        }
    }

    if (!groupId) return m.reply('ID grup tidak ditemukan.');

    const group = db.data.chats[groupId];

    if (!group?.sewa?.status) {
        return m.reply(
            `❌ *SEWA TIDAK AKTIF*\n\n` +
            `👥 Group ID: ${groupId}\n` +
            `💡 Grup ini tidak memiliki sewa aktif.`
        );
    }

    const prevExpired = moment(group.sewa.expired).tz('Asia/Jakarta').format('DD MMMM YYYY, HH:mm:ss');

    group.sewa.status = false;
    group.sewa.expired = 0;
    group.sewa.warned = false;

    db.data.chats[groupId] = group;
    db.save();

    m.reply(
        `✅ *SEWA GRUP DIHAPUS*\n\n` +
        `👥 Group ID: ${groupId}\n` +
        `📆 Expired sebelumnya: ${prevExpired} WIB\n\n` +
        `💡 Sewa grup telah dinonaktifkan.`
    );

    console.log(chalk.red(`[DELSEWA] Sewa grup ${groupId} dihapus. Expired sebelumnya: ${prevExpired}`));
};
handler.help = ['delsewa']
handler.command = ['delsewa', 'delsewagc', 'hapussewa'];
handler.tags = ['owner'];
handler.description = 'Menghapus sewa dari grup';
handler.owner = true;
handler.register = true;

export default handler;
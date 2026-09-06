let handler = async (m, { conn, args, text, usedPrefix, command }) => {
    try {
        if (!m || !m.sender) return;

        const channelId = args[0] || global.idch;

        if (!channelId || !channelId.endsWith('@newsletter')) {
            return m.reply(`• Example: .${command} <newsletter_id>\n\nExample:\n.${command} 120363406005175144\n\nOr use default channel: .${command}`);
        }

        const q = m.quoted || m;
        const msgContent = q.msg || q;
        const mime = msgContent.mimetype || '';

        if (!/video|gif|viewOnce/g.test(mime)) {
            return m.reply('• Reply/send video for PTV\n\nExample: .ptvch [video]');
        }

        const media = await (q.download ? q.download() : null);
        if (!media) {
            return m.reply('Media cannot be downloaded.');
        }

        await conn.sendMessage(channelId, { video: media, ptv: true });
        m.react('✅');
    } catch (error) {
        console.error('PTV Newsletter Error:', error);
        m.reply(`An error occurred: ${error.message}`);
    }
};

handler.help = ['ptvch [newsletter_id]'];
handler.tags = ['owner'];
handler.command = /^ptvch$/i;
handler.owner = true;

handler.register = true

export default handler;
const handler = async (m, {
    conn,
    text,
    usedPrefix,
    command,
    isAdmin
}) => {
    if (!m.isGroup) return m.reply("❌ Perintah ini hanya bisa digunakan di grup.");
    if (!isAdmin) return m.reply("❌ Perintah ini hanya khusus Admin Grup.");

    const q = m.quoted ? m.quoted : m;
    const mime = (q.msg || q).mimetype || '';

    const isMedia = /image|video/.test(mime);

    if (!text && !isMedia) {
        return m.reply(`Contoh penggunaan:\n\nKetik ${usedPrefix + command} Halo semua!\natau balas gambar/video dengan ${usedPrefix + command} caption`);
    }

    await m.reply('Merespon... sedang memproses status grup ⏳');

    try {
        const botJid = conn.decodeJid(conn.user?.id || conn.user?.jid);

        let ctxInfo = {
            isGroupStatus: true,
            participant: botJid // Kunci krusial agar reply bar muncul
        };

        if (isMedia) {
            let media = await q.download();
            let mediaContent: any = {
                contextInfo: ctxInfo
            };
            if (text) mediaContent.caption = text;

            if (/image/.test(mime)) {
                mediaContent.image = media;
                await conn.sendMessage(m.chat, mediaContent);
            } else if (/video/.test(mime)) {
                mediaContent.video = media;
                await conn.sendMessage(m.chat, mediaContent);
            }
        } else {
            await conn.sendMessage(m.chat, {
                text: text,
                contextInfo: ctxInfo
            });
        }

        m.reply('✅ Status grup berhasil dikirim!');
    } catch (e: any) {
        console.error(e);
        m.reply('❌ Gagal mengirim status grup: ' + (e.message || e));
    }
};

handler.help = ['statusgrup', 'swgc'];
handler.tags = ['group'];
handler.command = ['statusgrup', 'swgc'];
handler.group = true;
handler.admin = true;

export default handler;
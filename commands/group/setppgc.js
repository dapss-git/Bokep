let handler = async (m, {
    conn,
    command,
    usedPrefix
}) => {
    const chatId = global.decodeChat ? global.decodeChat(m, conn) : m.chat

    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || q.mediaType || ''

    if (!/image/i.test(mime) || /webp/i.test(mime)) {
        return m.reply(`Kirim gambar dengan caption *${usedPrefix + command}* atau tag gambar yang sudah dikirim`)
    }

    try {
        let media = await q.download()
        if (!media) return m.reply('Gagal mengunduh gambar.')

        await conn.updateProfilePicture(chatId, media)

        m.reply(`Admin @${(m.sender || '').replace(/@s\.whatsapp\.net/g, '')} telah mengganti Icon Group!`, null, {
            mentions: [m.sender]
        })
    } catch (e) {
        console.error(e)
        m.reply('❌ Gagal memperbarui foto profil grup.\nPastikan:\n• Bot adalah admin grup\n• Gambar valid dan tidak terlalu besar')
    }
}

handler.help = ['setppgc']
handler.tags = ['group']
handler.command = /^(setppgc|setppgcpanjang|setppgrup|setppgroup)$/i
handler.admin = true
handler.botAdmin = true
handler.group = true
handler.register = true;

export default handler
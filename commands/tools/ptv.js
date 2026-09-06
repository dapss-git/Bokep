let handler = async (m, { conn }) => {
    if (!m || !m.sender) return

    let q = m.quoted || m
    let msgContent = q.msg || q
    let mime = msgContent.mimetype || ""

    if (!/video|gif|viewOnce/g.test(mime)) {
        m.reply(`*• Example :* .ptv *[reply/send media]*`)
        return
    }

    let media = await q.download?.() || q.download?.media || null
    if (!media) {
        m.reply("Media tidak bisa diunduh.")
        return
    }

    await conn.sendMessage(
        m.chat, {
            video: media,
            ptv: true
        }
    )

    m.react('✅')
}

handler.help = ['ptv']
handler.tags = ['tools']
handler.command = ['ptv']
handler.limit = true;
handler.register = true;

export default handler

const delay = ms => new Promise(res => setTimeout(res, ms))

const handler = async (m, {
    conn,
    text
}) => {
    try {

        let jids = text ?
            text.split(' ').filter(v => v.endsWith('@g.us')) : [m.chat]

        if (!jids.length) return m.reply('Tidak ada target group')

        const quoted = m.quoted ? m.quoted : m
        const mime = (quoted.msg || quoted).mimetype || ""

        let payload = {}

        if (/image/.test(mime)) {
            const buffer = await quoted.download()
            payload = {
                image: buffer,
                caption: text || ''
            }

        } else if (/video/.test(mime)) {
            const buffer = await quoted.download()
            payload = {
                video: buffer,
                caption: text || ''
            }

        } else if (/audio/.test(mime)) {
            const buffer = await quoted.download()
            payload = {
                audio: buffer,
                mimetype: 'audio/mp4',
                ptt: true
            }

        } else if (/sticker/.test(mime)) {
            const buffer = await quoted.download()
            payload = {
                sticker: buffer
            }

        } else if (/document/.test(mime)) {
            const buffer = await quoted.download()
            payload = {
                document: buffer,
                mimetype: quoted.mimetype,
                fileName: quoted.fileName || 'file'
            }

        } else {
            payload = {
                text: text || "Hello Everyone"
            }
        }

        // 🔥 pakai sendStatusMentions
        await conn.sendStatusMentions(payload, jids)

        m.reply(`✅ Status berhasil dikirim ke ${jids.length} target`)

    } catch (e) {
        console.error(e)
        m.reply("❌ Gagal mengirim status")
    }
}

handler.help = ['upsw']
handler.tags = ['owner']
handler.command = ['upsw']
handler.owner = owner
handler.register = true

export default handler
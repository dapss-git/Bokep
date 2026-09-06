import { toPTT } from '../../library/converter.js'

let handler = async (m, {
    conn,
    usedPrefix,
    command
}) => {
    try {
        const q = m.quoted ? m.quoted : m
        const mime = q.msg?.mimetype || q.mimetype || ''

        if (!/audio|video/.test(mime)) {
            return m.reply(
                `Reply video/audio yang ingin dijadikan VN dengan caption ${usedPrefix + command}`
            )
        }

        await global.loading(m, conn)

        const media = await q.download()
        if (!media) {
            return m.reply('Gagal download media')
        }

        const ext = mime.split('/')[1] || 'mp4'
        const { data, filename, delete: deleteFile } = await toPTT(media, ext)

        await conn.sendFile(m.chat, data, 'audio.ogg', '', m, { ptt: true, mimetype: 'audio/ogg; codecs=opus' })

        await deleteFile()

    } catch (e) {
        console.error(e)
        m.reply('Gagal convert ke PTT')
    } finally {
        global.loading(m, conn, true)
    }
}

handler.help = ['tovn']
handler.tags = ['audio']
handler.command = /^to(vn|(ptt)?)$/i
handler.register = true
handler.limit = true

export default handler

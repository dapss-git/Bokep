import { addExif } from '../../library/sticker.js'

let handler = async (m, { conn, text }) => {
    if (!m || !m.sender) return

    try {
        let q = m.quoted ? m.quoted : m
        let mime = (q.msg || q).mimetype || q.mediaType || ''

        if (!/webp/.test(mime)) {
            return m.reply(
                'Reply atau kirim sticker dengan perintah wm\n\nContoh:\n.wm Pack|Author'
            )
        }

        let [packname, ...author] = (text || '').split('|')
        author = author.join('|')

        let img = await q.download()
        if (!img) {
            return m.reply('Gagal mengambil sticker')
        }

        let sticker = await addExif(
            img,
            packname?.trim() || '',
            author?.trim() || ''
        )

        await conn.sendMessage(
            m.chat,
            {
                sticker: sticker
            },
            {
                quoted: m
            }
        )

    } catch (error) {
        console.error(error)
        m.reply('Terjadi kesalahan saat memberi watermark sticker')
    }
}

handler.help = ['wm']
handler.tags = ['maker']
handler.command = ['wm']
handler.register = true;

export default handler

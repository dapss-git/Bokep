import {
    sticker
} from '../../library/sticker.js'

let handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {
    try {
        if (!text) {
            return m.reply(`Masukkan teks!\nContoh: ${usedPrefix + command} halo`)
        }

        const url = global.API('theresav', '/maker/bratanime', {
            text: text
        }, 'apikey')

        const res = await fetch(url)
        const data = await res.arrayBuffer()

        const stick = await sticker(Buffer.from(data), {
            packname: m.pushName,
            author: global.author
        })

        await conn.sendMessage(m.chat, {
            sticker: stick
        }, {
            quoted: m
        })

    } catch (e) {
        console.error(e)
        m.reply(`Error: ${e.message}`)
    }
}

handler.help = ['bratanime <teks>']
handler.tags = ['maker']
handler.command = /^(bratanime)$/i
handler.description = 'Membuat sticker bratanime dari teks.'
handler.register = true

export default handler
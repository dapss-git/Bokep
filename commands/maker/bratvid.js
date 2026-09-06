import {
    sticker
} from '../../library/sticker.js'

let handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {

    if (!text) {
        return m.reply(
            `Masukkan teks untuk stiker Brat!\n\nContoh:\n${usedPrefix + command} Halo Brat`
        )
    }

    try {
        global.loading(m, conn)

        const url = global.API('theresav', '/maker/bratvid', {
            text,
            format: 'gif'
        })

        const res = await fetch(url)

        if (!res.ok) {
            global.loading(m, conn, true)
            return m.reply('Gagal mengambil stiker dari API')
        }

        const buffer = await res.arrayBuffer()

        const stiker = await sticker(
            Buffer.from(buffer),
            false,
            global.wm,
            global.author
        )

        if (!stiker) {
            global.loading(m, conn, true)
            return m.reply('Gagal membuat stiker.')
        }

        global.loading(m, conn, true)

        await conn.sendFile(
            m.chat,
            stiker,
            'BratSticker.webp',
            '',
            m
        )

    } catch (e) {
        global.loading(m, conn, true)
        console.error(e)
        m.reply('Gagal membuat stiker, coba lagi nanti.')
    }
}

handler.help = ['bratvid <text>']
handler.tags = ['maker']
handler.command = /^bratvid$/i
handler.limit = true
handler.register = true

export default handler
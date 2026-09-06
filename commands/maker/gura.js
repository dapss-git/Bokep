import {
    sticker
} from '../../library/sticker.js'

const handler = async (m, {
    conn,
    args,
    usedPrefix,
    command
}) => {
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || q.mediaType || ''

    if (!mime || !/image/.test(mime)) {
        return m.reply(`Kirim/reply gambar\nContoh: ${usedPrefix + command} pack|author`)
    }

    let [packname, ...author] = args.join(' ').split('|')
    packname = packname || global.wm || ''
    author = (author || []).join('|') || global.author || ''

    try {
        await global.loading(m, conn)

        let buffer = await q.download?.()
        if (!buffer) return m.reply("❌ Gagal download gambar")

        const form = new FormData()
        form.append('image', new Blob([buffer], {
            type: mime
        }), 'image.jpg')
        form.append('apikey', global.APIKeys[global.APIs['theresav']])

        const url = global.API("theresav", "/canvas/gura", {}, "apikey")

        const res = await fetch(url, {
            method: 'POST',
            body: form
        })

        if (!res.ok) throw new Error(`Status ${res.status}`)

        const img = Buffer.from(await res.arrayBuffer())

        if (!img || img.length < 1000) {
            return m.reply("❌ Hasil tidak valid")
        }

        const stiker = await sticker(img, null, packname, author)

        await conn.sendMessage(m.chat, {
            sticker: stiker
        }, {
            quoted: m
        })

    } catch (e) {
        console.error(e)
        m.reply('Error: ' + e.message)
    } finally {
        await global.loading(m, conn, true)
    }
}

handler.help = ['gura <pack|author>']
handler.tags = ['maker']
handler.command = /^gura$/i
handler.limit = true

handler.register = true

export default handler
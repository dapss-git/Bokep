import {
    sticker
} from '../../library/sticker.js'
import sharp from 'sharp'

async function circle(buffer) {
    const img = sharp(buffer)
    const meta = await img.metadata()

    const size = Math.min(meta.width, meta.height)

    const svg = `
	<svg width="${size}" height="${size}">
		<circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="white"/>
	</svg>`

    return await img
        .resize(size, size)
        .composite([{
            input: Buffer.from(svg),
            blend: 'dest-in'
        }])
        .png()
        .toBuffer()
}

let handler = async (m, {
    conn,
    usedPrefix,
    command
}) => {
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || q.mediaType || ''

    if (!mime || !/image/.test(mime)) {
        return m.reply(`Kirim/reply gambar dengan caption\n${usedPrefix + command}`)
    }

    let img = await q.download?.()
    if (!img) return m.reply('❌ Gagal download media')

    let circled
    try {
        circled = await circle(img)
    } catch (e) {
        console.log('CIRCLE ERROR:', e)
        return m.reply('❌ Gagal proses gambar')
    }

    const packname = global.wm || 'Sticker'
    const author = global.author || 'Bot'

    let stiker
    try {
        stiker = await sticker(circled, {
            packname,
            author
        })
    } catch (e) {
        console.log('STICKER ERROR:', e)
        return m.reply('❌ Gagal generate stiker')
    }

    if (!stiker) return m.reply('❌ Stiker kosong')

    await conn.sendFile(m.chat, stiker, 'circle.webp', m)
}

handler.help = ['scircle']
handler.tags = ['maker']
handler.command = /^(scircle|scir)$/i
handler.limit = true
handler.register = true

export default handler
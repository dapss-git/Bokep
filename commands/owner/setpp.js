import {
    Jimp
} from 'jimp'

const generateProfilePicture = async (buffer) => {
    const jimp = await Jimp.read(buffer)
    return jimp
        .crop({
            x: 0,
            y: 0,
            w: jimp.bitmap.width,
            h: jimp.bitmap.height
        })
        .scaleToFit({
            w: 720,
            h: 720
        })
        .getBuffer('image/jpeg')
}

let handler = async (m, {
    conn
}) => {
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || ''

    if (!/image/.test(mime)) throw '❌ Kirim / reply gambar dulu'

    let media = await q.download()
    if (!media) throw '❌ Gambar gagal diambil'

    media = await generateProfilePicture(media)

    await conn.query({
        tag: 'iq',
        attrs: {
            target: undefined,
            to: 's.whatsapp.net',
            type: 'set',
            xmlns: 'w:profile:picture'
        },
        content: [{
            tag: 'picture',
            attrs: {
                type: 'image'
            },
            content: media
        }]
    })

    m.reply('✅ PP bot berhasil')
}

handler.help = ['setpp']
handler.tags = ['owner']
handler.command = /^(setpp|setbotpp)$/i
handler.owner = true
handler.register = true;

export default handler
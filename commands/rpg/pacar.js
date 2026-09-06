import {
    prepareWAMessageMedia
} from 'baileys'

let handler = async (m, {
    conn
}) => {
    let user = global.db.data.users

    if (!user[m.sender]) {
        return m.reply("Kamu belum terdaftar di database")
    }

    let pacar = user[m.sender].pacar

    if (!pacar) {
        return m.reply("Kamu tidak memiliki pacar")
    }

    if (!user[pacar]) {
        return m.reply("Data pacar tidak ditemukan")
    }

    if (user[pacar].pacar !== m.sender) {
        return m.reply("Relasi tidak valid / sudah putus")
    }

    let time = user[m.sender].pacaranTime

    if (!time || isNaN(time)) {
        return m.reply("Data waktu pacaran tidak valid")
    }

    let date = dateTime(time)

    const imgUrl = "https://akcdn.detik.net.id/visual/2016/09/20/34ce7ca9-7652-4631-a37e-459e465d824c_169.jpg?w=400&q=90"
    const pageUrl = global.website || imgUrl
    const text = `💖 *P A C A R A N*\n\nKamu sudah berpacaran dengan @${pacar.split("@")[0]} sejak ${date}`

    let thumbBuf
    try {
        const imgRes = await fetch(imgUrl)
        thumbBuf = Buffer.from(await imgRes.arrayBuffer())
    } catch {
        thumbBuf = undefined
    }

    let image
    if (thumbBuf) {
        try {
            const {
                imageMessage
            } = await prepareWAMessageMedia({
                image: thumbBuf
            }, {
                upload: conn.waUploadToServer,
                mediaTypeOverride: 'thumbnail-link'
            })
            image = imageMessage
            image.width = 1280
            image.height = 720
        } catch {}
    }

    await conn.sendMessage(m.chat, {
        text: `${pageUrl}\n\n${text}`,
        mentions: [pacar],
        linkPreview: {
            'matched-text': pageUrl,
            title: '💖 Pacaran',
            description: `Berpacaran sejak ${date}`,
            previewType: 0,
            jpegThumbnail: thumbBuf,
            ...(image ? {
                highQualityThumbnail: image
            } : {}),
            linkPreviewMetadata: {
                linkMediaDuration: 0,
                socialMediaPostType: 4
            }
        }
    }, {
        quoted: m
    })
}

handler.help = ["pacar"]
handler.tags = ["rpg"]
handler.command = /^(pacar)$/i

handler.register = true

export default handler

function dateTime(timestamp) {
    const date = new Date(timestamp)
    if (isNaN(date)) return "Tidak diketahui"
    return date.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
    })
}
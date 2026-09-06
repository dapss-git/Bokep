const handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || q.mediaType || ''

    if (!mime || !/image/.test(mime)) {
        return m.reply(`Kirim/reply gambar dengan caption\n${usedPrefix + command}`)
    }

    if (!text) {
        return m.reply(
            `Contoh: ${usedPrefix + command} provinsi|kota|nik|nama|ttl|jenis_kelamin|golongan_darah|alamat|rt/rw|kelurahan|kecamatan|agama|status|pekerjaan|kewarganegaraan|masa_berlaku|terbuat`
        )
    }

    try {
        await conn.sendMessage(m.chat, {
            react: {
                text: '⏳',
                key: m.key
            }
        })

        const params = text.split('|').map(v => v.trim())
        if (params.length < 17) {
            return m.reply(`🍂 Parameter kurang! (${params.length}/17)`)
        }

        let buffer = await q.download?.()
        if (!buffer) return m.reply("❌ Gagal download gambar")

        const form = new FormData()
        form.append('photo', new Blob([buffer], {
            type: mime
        }), 'ktp.jpg')

        form.append('provinsi', params[0])
        form.append('kota', params[1])
        form.append('nik', params[2])
        form.append('nama', params[3])
        form.append('ttl', params[4])
        form.append('jenis_kelamin', params[5])
        form.append('golongan_darah', params[6])
        form.append('alamat', params[7])
        form.append('rt/rw', params[8])
        form.append('kel/desa', params[9])
        form.append('kecamatan', params[10])
        form.append('agama', params[11])
        form.append('status', params[12])
        form.append('pekerjaan', params[13])
        form.append('kewarganegaraan', params[14])
        form.append('masa_berlaku', params[15])
        form.append('terbuat', params[16])
        form.append('apikey', global.APIKeys[global.APIs['theresav']])

        const url = global.API("theresav", "/canvas/ektp", {}, "apikey")

        const res = await fetch(url, {
            method: 'POST',
            body: form
        })

        if (!res.ok) throw new Error(`Status ${res.status}`)

        const result = Buffer.from(await res.arrayBuffer())

        await conn.sendMessage(m.chat, {
            image: result,
            caption: "✅ Fake KTP berhasil dibuat"
        }, {
            quoted: m
        })

    } catch (e) {
        console.error(e)
        m.reply(`🍂 Error: ${e.message}`)
    } finally {
        await conn.sendMessage(m.chat, {
            react: {
                text: '',
                key: m.key
            }
        })
    }
}

handler.help = ['fakektp']
handler.tags = ['maker']
handler.command = /^(fakektp|cktp)$/i
handler.limit = true
handler.register = true

export default handler
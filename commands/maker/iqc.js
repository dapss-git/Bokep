import fetch from 'node-fetch'
import FormData from 'form-data'
import crypto from 'crypto'

const uploadAthars = async (buffer, ext = 'jpg') => {
    const name = `${crypto.randomBytes(5).toString('hex')}.${ext}`
    const form = new FormData()
    form.append('file', buffer, name)
    const res = await fetch('https://athars.space/upload.php', {
        method: 'POST',
        headers: form.getHeaders(),
        body: form
    })
    const data = await res.text()
    if (!data) throw new Error('Upload gagal')
    return data.trim()
}

const fetchAsImage = async (apiUrl) => {
    const res = await fetch(apiUrl)
    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('image')) {
        return Buffer.from(await res.arrayBuffer())
    }
    const json = await res.json().catch(() => ({}))
    const imgUrl = json.url || json.result?.url || json.data?.url || json.image || json.result
    if (!imgUrl) throw new Error('API tidak mengembalikan gambar')
    const imgRes = await fetch(imgUrl)
    if (!imgRes.ok) throw new Error('Gagal mengambil gambar')
    return Buffer.from(await imgRes.arrayBuffer())
}

let handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {
    const cmd = command.toLowerCase()

    if (cmd === 'iqc') {
        if (!text) return m.reply(`Masukkan teks untuk quote.\nContoh: ${usedPrefix}iqc Halo dunia`)
        await global.loading(m, conn)
        try {
            const apiUrl = global.urlApi('azbry', '/api/maker/iqc', {
                text
            })
            const buffer = await fetchAsImage(apiUrl)
            await conn.sendMessage(m.chat, {
                image: buffer,
                caption: '✨ IQC'
            }, {
                quoted: m
            })
        } catch (e) {
            m.reply(`❌ Gagal: ${e.message}`)
        } finally {
            await global.loading(m, conn, true)
        }
        return
    }

    if (cmd === 'iqcs') {
        if (!text) return m.reply(`Kirim/reply gambar atau sticker dengan caption:\n${usedPrefix}iqcs teks quote`)
        let q = m.quoted || m
        let mime = (q.msg || q).mimetype || ''
        if (!/image|webp|sticker/i.test(mime)) {
            return m.reply('Kirim atau reply gambar/sticker untuk dijadikan IQC sticker.')
        }
        await global.loading(m, conn)
        try {
            let buffer = await q.download()
            if (!buffer) throw new Error('Gagal mengunduh media')
            const ext = mime.includes('webp') ? 'webp' : 'jpg'
            const imgUrl = await uploadAthars(buffer, ext)
            const apiUrl = global.urlApi('azbry', '/api/maker/iqc-sticker', {
                text,
                img: imgUrl
            })
            const resultBuffer = await fetchAsImage(apiUrl)
            await conn.sendMessage(m.chat, {
                image: resultBuffer,
                caption: '✨ IQC Sticker'
            }, {
                quoted: m
            })
        } catch (e) {
            m.reply(`❌ Gagal: ${e.message}`)
        } finally {
            await global.loading(m, conn, true)
        }
        return
    }
}

handler.help = ['iqc <teks>', 'iqcs <teks>']
handler.tags = ['maker']
handler.command = /^(iqc|iqcs)$/i
handler.limit = true
handler.register = true

export default handler
import crypto from 'crypto'
import sharp from 'sharp'
import {
    fileTypeFromBuffer
} from 'file-type'

async function uploadToGithub(buffer, fileName, mimeType, ext) {
    const content = buffer.toString('base64')
    const folder = 'image'
    const finalName = `${fileName}.${ext}`
    const path = `upload/${folder}/${finalName}`

    const url = `https://api.github.com/repos/${global.deploy.github.user}/uploader/contents/${path}`

    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${global.deploy.github.token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: `Upload ${finalName}`,
            content: content,
            branch: 'main'
        })
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(`GitHub API error: ${error.message || response.statusText}`)
    }

    const data = await response.json()
    return {
        name: finalName,
        path: data.content.path,
        url: data.content.download_url,
        sha: data.content.sha,
        folder: folder
    }
}

let handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {
    if (!text) {
        return m.reply(`Kirim/Reply gambar atau sticker dengan caption ${usedPrefix + command} <prompt>\nContoh: ${usedPrefix + command} Ubah jadi anime`)
    }

    if (!global.deploy || !global.deploy.github || !global.deploy.github.token || global.deploy.github.token === '-') {
        return m.reply('❌ GitHub token belum dikonfigurasi di global.deploy.github.token')
    }

    const q = m.quoted ? m.quoted : m
    const mime = (q.msg || q).mimetype || ''
    const isSticker = /image\/webp/.test(mime) || q.mtype === 'stickerMessage' || q.message?.stickerMessage

    if (!/image/.test(mime) && !isSticker) {
        return m.reply('❌ Kirim/Reply gambar atau sticker terlebih dahulu.')
    }

    const mediaBuffer = await q.download()
    if (!mediaBuffer) return m.reply('Gagal mengunduh media.')

    await global.loading(m, conn)

    try {
        let jpgBuffer
        if (isSticker) {
            jpgBuffer = await sharp(mediaBuffer, {
                    animated: true
                })
                .jpeg({
                    quality: 90
                })
                .toBuffer()
        } else {
            jpgBuffer = await sharp(mediaBuffer)
                .jpeg({
                    quality: 90
                })
                .toBuffer()
        }

        const fileType = await fileTypeFromBuffer(jpgBuffer)
        const ext = fileType?.ext || 'jpg'
        const randomName = crypto.randomBytes(5).toString('hex')
        const resultUpload = await uploadToGithub(jpgBuffer, randomName, 'image/jpeg', ext)
        const imageUrl = resultUpload.url

        const apiUrl = global.urlApi('snowping', '/api/imageai/nanobanana', {
            url: imageUrl,
            prompt: text.trim()
        })

        const res = await fetch(apiUrl)
        const json = await res.json()
        if (json.status !== 200 || !json.result?.image) throw new Error(json.message || 'Gagal memproses gambar')

        const resultRes = await fetch(json.result.image)
        const resultBuffer = Buffer.from(await resultRes.arrayBuffer())

        const isStickerResult = ['aiedits', 'editais'].includes(command)

        if (isStickerResult) {
            const stickerBuffer = await sharp(resultBuffer)
                .webp({
                    quality: 95
                })
                .toBuffer()
            await conn.sendMessage(m.chat, {
                sticker: stickerBuffer
            }, {
                quoted: m
            })
        } else {
            await conn.sendMessage(m.chat, {
                image: resultBuffer,
                caption: `✅ ᴇᴅɪᴛ ᴀɪ ᴘʀᴏᴍᴘᴛ: ${text.trim()}`
            }, {
                quoted: m
            })
        }

    } catch (e) {
        console.error(e)
        m.reply(`❌ Gagal: ${e.message}`)
    } finally {
        await global.loading(m, conn, true)
    }
}

handler.help = ['aiedit <prompt>', 'aiedits <prompt>', 'editai <prompt>', 'editais <prompt>']
handler.tags = ['ai', 'image', 'sticker']
handler.command = /^(aiedit|aiedits|editai|editais)$/i
handler.limit = true
handler.register = true

export default handler
import fs from 'fs'
import {
    prepareWAMessageMedia
} from 'baileys'

const handler = async (m, {
    conn
}) => {
    const groupLink = global.linkgc || 'https://chat.whatsapp.com/defaultlink'

    let imageBuffer = null

    try {
        const code = groupLink.match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/)?.[1]

        if (!code) throw new Error('Invalid group link')

        const info = await conn.groupGetInviteInfo(code)
        const ppUrl = await conn.profilePictureUrl(info.id, 'image')

        const res = await fetch(ppUrl)
        imageBuffer = Buffer.from(await res.arrayBuffer())
    } catch {
        const imagePath = './media/menu.jpg'

        if (fs.existsSync(imagePath)) {
            imageBuffer = fs.readFileSync(imagePath)
        }
    }

    let hqImage = null

    if (imageBuffer) {
        const {
            imageMessage
        } = await prepareWAMessageMedia({
            image: imageBuffer
        }, {
            upload: conn.waUploadToServer,
            mediaTypeOverride: 'thumbnail-link'
        })

        imageMessage.width = 1280
        imageMessage.height = 720

        hqImage = imageMessage
    }

    await conn.sendMessage(
        m.chat, {
            text: `👋 *Join the Official Bot Group!*\n\n${groupLink}`,
            ...(hqImage && {
                linkPreview: {
                    'matched-text': groupLink,
                    title: '🌐 Official Group',
                    description: 'Click the link above to join the community!',
                    previewType: 0,
                    jpegThumbnail: imageBuffer,
                    highQualityThumbnail: hqImage,
                    socialMediaPostType: 4
                }
            })
        }, {
            quoted: m
        }
    )
}

handler.help = ['gcbot']
handler.tags = ['info']
handler.command = ['gcbot', 'groupbot', 'botgc']
handler.register = true
handler.limit = true

export default handler
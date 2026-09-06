import {
    prepareWAMessageMedia
} from 'baileys'

let handler = async (m, {
    conn,
    usedPrefix
}) => {
    try {
        const userData = global.db.data.users[m.sender];

        if (!userData.life || !userData.life.verified) {
            return m.reply(`⚠️ Untuk menggunakan fitur ini, kamu harus teregistrasi terlebih dahulu.\n\nKetik ${usedPrefix}setlife`);
        }

        const user = userData.life;

        if (!user.waifu) {
            return m.reply(`⚠️ Kamu belum punya waifu!\nKetik ${usedPrefix}setwaifu untuk mencari waifu.`);
        }

        await global.loading(m, conn);

        const query = `${user.waifu} anime icons`;
        const url = API('theresav', '/search/pinterest', {
            query
        }, 'apikey');

        const res = await fetch(url);
        const json = await res.json();

        let imageUrl = user.waifuImage || 'https://myanimelist.net/character/248058/Set';

        if (json?.status && Array.isArray(json.result) && json.result.length) {
            const pick = json.result[Math.floor(Math.random() * json.result.length)];
            imageUrl = pick.directLink || imageUrl;
        }

        let thumbBuf
        try {
            const img = await fetch(imageUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'https://www.pinterest.com/'
                }
            });
            thumbBuf = Buffer.from(await img.arrayBuffer());
        } catch {
            thumbBuf = undefined;
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

        const caption = `WAIFU INFO
💃🏻 Nama Waifu: ${user.waifu}
💘 Level Waifu: ${user.exp}

${user.name} dan ${user.waifu} adalah pasangan bahagia ❤️

Tingkatkan level waifumu dengan ${usedPrefix}kencan`;

        await conn.sendMessage(m.chat, {
            text: `${imageUrl}\n\n${caption}`,
            linkPreview: {
                'matched-text': imageUrl,
                title: `Hi, I'm ${user.waifu}`,
                description: `${user.name} dan ${user.waifu} adalah pasangan bahagia ❤️`,
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
        });

    } catch (e) {
        console.error(e);
        m.reply('Terjadi error');
    } finally {
        await global.loading(m, conn, true);
    }
};

handler.command = handler.help = ['waifume'];
handler.tags = ['rpg'];
handler.rpg = true;
handler.register = true;

export default handler;
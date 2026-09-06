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
            return m.reply(`⚠️ Untuk menggunakan fitur ini, kamu harus teregistrasi terlebih dahulu.\n\nKetik *${usedPrefix}setlife*`);
        }

        const user = userData.life;

        if (!user.husbu) {
            return m.reply(`⚠️ Kamu belum punya husbu!\nKetik *${usedPrefix}sethusbu* untuk mencari husbu.`);
        }

        await global.loading(m, conn);

        const query = `${user.husbu} anime icons`;
        const url = API('theresav', '/search/pinterest', {
            query
        }, 'apikey');
        const res = await fetch(url);
        const json = await res.json();

        let imageUrl = user.husbuImage || 'https://myanimelist.net/character/248058/Set';
        if (json?.status && Array.isArray(json.result) && json.result.length) {
            const pick = json.result[Math.floor(Math.random() * json.result.length)];
            imageUrl = pick.directLink || imageUrl;
        }

        let thumbBuf
        try {
            const imgRes = await fetch(imageUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'https://www.pinterest.com/'
                }
            });
            thumbBuf = Buffer.from(await imgRes.arrayBuffer());
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

        const caption = `*HUSBU INFO*
💘 Nama Husbu: ${user.husbu}
💗 Level Husbu: ${user.exp}

${user.name} dan ${user.husbu} adalah sepasang kekasih dengan kehidupan yang sangat bahagia. ${user.name} beruntung sekali karena memilih husbu seperti ${user.husbu}. Semoga mereka selalu hidup bahagia.

Tingkatkan level husbu mu dengan melakukan kencan *${usedPrefix}kencan*

Fact: _level husbu mu tidak akan ter-reset walaupun sudah mengganti husbu._`;

        await conn.sendMessage(m.chat, {
            text: `${imageUrl}\n\n${caption}`,
            linkPreview: {
                'matched-text': imageUrl,
                title: `Hi, I'm ${user.husbu}`,
                description: `${user.name} dan ${user.husbu} adalah sepasang kekasih yang bahagia ❤️`,
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
        throw e;
    } finally {
        await global.loading(m, conn, true);
    }
};

handler.command = handler.help = ['husbume'];
handler.tags = ['rpg'];
handler.rpg = true;
handler.register = true;

export default handler;
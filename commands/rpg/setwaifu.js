import {
    prepareWAMessageMedia
} from 'baileys'

const JIKAN = "https://api.jikan.moe/v4";

const handler = async (m, {
    conn,
    text,
    args,
    usedPrefix,
    isPrems,
    command
}) => {
    const user = global.db.data.users[m.sender];
    const life = user?.life;

    if (!text) {
        return m.reply(`Gunakan format:\n${usedPrefix + command} [nama waifu]`);
    }

    if (!life?.verified) {
        return m.reply(`⚠️ Kamu harus set life terlebih dahulu.\n\nKetik ${usedPrefix}setlife`);
    }

    if (Number(life.age) <= 16) {
        return m.reply("⚠️ Minimal umur 17 tahun.");
    }

    if (life.gender !== "male") {
        return m.reply("⚠️ Fitur waifu hanya untuk male.");
    }

    if (args[0] === "set") {
        let url = decodeURIComponent(args.slice(1).join(" "));
        if (!url) return m.reply("❌ URL tidak valid.");
        
        try {
            const apiUrl = global.API('theresav', '/anime/myanimelist/chara/detail', { url }, 'apikey');
            const res = await fetch(apiUrl);
            const data = await res.json();

            if (!data?.status || !data?.result) return m.reply("❌ Data tidak ditemukan.");
            
            const chara = data.result;

            const image = await getPinterestImage(chara.name, chara.cover);

            life.waifu = chara.name;
            life.waifuId = chara.url;
            life.about = chara.description || null;
            life.waifuImage = image;

            user.autoaiChatId = "";

            if (!isPrems && life.gamepas >= 1) {
                life.gamepas -= 1;
                await m.reply("-1 💳 gamepass");
            }

            await global.db.save();

            await send(conn, m, chara.name, `💖 Waifu dipilih: ${chara.name}\n❤️ Favorites: ${chara.favorites || 0}`, image, chara.url);

        } catch (e) {
            console.error(e);
            return m.reply("❌ Gagal set waifu.");
        }
        return;
    }

    try {
        const url = global.API('theresav', '/anime/myanimelist/chara/search', { q: text }, 'apikey');
        const res = await fetch(url);
        const data = await res.json();

        if (!data?.status || !data?.result?.length) {
            return m.reply("❌ Waifu tidak ditemukan.");
        }

        const rows = data.result.slice(0, 10).map((x) => ({
            header: x.anime?.[0]?.title || x.manga?.[0]?.title || '',
            title: x.name,
            description: [x.anime?.[0]?.title, x.manga?.[0]?.title].filter(Boolean).join(' | ') || '-',
            id: `${usedPrefix}setwaifu set ${encodeURIComponent(x.url)}`
        }));

        return conn.sendMessage(m.chat, {
            text: `🔍 Hasil waifu: "${text}"\nPilih di bawah 👇`,
            footer: global.botname,
            buttons: [{
                buttonId: "waifu_select",
                buttonText: {
                    displayText: "💕 Pilih Waifu"
                },
                type: 4,
                nativeFlowInfo: {
                    name: "single_select",
                    paramsJson: JSON.stringify({
                        title: "Daftar Waifu",
                        sections: [{
                            title: `Result: ${text}`,
                            rows
                        }]
                    })
                }
            }]
        }, {
            quoted: m
        });

    } catch (e) {
        console.error(e);
        m.reply("❌ Error saat mencari waifu.");
    }
};

handler.command = ["setwaifu"];
handler.tags = ["rpg"];
handler.premium = true;
handler.register = true;

export default handler;

async function send(conn, m, title, text, imgUrl, pageUrl) {
    const url = pageUrl || imgUrl;

    let thumbBuf;
    try {
        const imgRes = await fetch(imgUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.pinterest.com/'
            }
        });
        thumbBuf = Buffer.from(await imgRes.arrayBuffer());
    } catch {
        thumbBuf = undefined;
    }

    let image;
    if (thumbBuf) {
        try {
            const {
                imageMessage
            } = await prepareWAMessageMedia({
                image: thumbBuf
            }, {
                upload: conn.waUploadToServer,
                mediaTypeOverride: 'thumbnail-link'
            });
            image = imageMessage;
            image.width = 1280;
            image.height = 720;
        } catch {}
    }

    await conn.sendMessage(m.chat, {
        text: `${url}\n\n${text}`,
        linkPreview: {
            'matched-text': url,
            title,
            description: text.slice(0, 60),
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
}

async function getPinterestImage(query, fallbackUrl) {
    try {
        const url = global.API(
            "theresav",
            "/search/pinterest", {
                query,
                type: "image"
            },
            "apikey"
        );

        const res = await fetch(url);
        const json = await res.json();

        if (json?.status && Array.isArray(json.result) && json.result.length) {
            const pick = json.result[Math.floor(Math.random() * json.result.length)];
            return pick.directLink;
        }
    } catch (e) {
        console.error(e);
    }

    return fallbackUrl || "https://myanimelist.net/character/248058/Set";
}
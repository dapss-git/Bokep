import axios from "axios";
import {
    proto,
    generateWAMessageContent
} from "baileys";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function fetchTiktok(url) {
    // 1. Coba melalui API Theresav (Bypass WAF TikTok & Fast)
    try {
        const apiRes = await global.fetchAPI('theresav', '/download/tiktok', { url }, 'x-apikey');
        const json = await apiRes.json();
        if (json?.status && (json.video_url || (json.images && json.images.length))) {
            return json;
        }
    } catch (e) {
        console.error('[TIKTOK API ERROR]:', e.message);
    }

    // 2. Fallback: Direct Web Scraper
    const response = await axios.get(url, {
        headers: {
            "User-Agent": UA,
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        },
        timeout: 15000,
    });

    const setCookies = response.headers["set-cookie"] || [];
    const cookieStr = setCookies.map((c) => c.split(";")[0]).join("; ");

    const html = response.data;
    const scriptMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application\/json">([\s\S]*?)<\/script>/) ||
                        html.match(/<script id="SIGI_STATE" type="application\/json">([\s\S]*?)<\/script>/);

    if (!scriptMatch) {
        throw new Error("Gagal mengekstrak data dari TikTok web.");
    }

    const data = JSON.parse(scriptMatch[1]);
    let found = false;
    const resultData = { cookie: cookieStr };

    function findMedia(obj) {
        if (found || !obj || typeof obj !== "object") return;
        const item = obj.itemStruct || (obj.itemModule && Object.values(obj.itemModule)[0]);
        if (item) {
            resultData.metadata = {
                title: item.desc || "Tanpa Judul",
                author: item.author ? {
                    nickname: item.author.nickname,
                    username: item.author.uniqueId,
                } : null,
                stats: item.stats ? {
                    views: item.stats.playCount,
                    likes: item.stats.diggCount,
                    comments: item.stats.commentCount,
                    shares: item.stats.shareCount,
                    saves: item.stats.collectCount,
                } : null,
            };

            if (item.imagePost?.images) {
                found = true;
                resultData.type = "slide";
                resultData.images = item.imagePost.images.map(img => img.imageURL?.urlList?.[0]).filter(Boolean);
            } else if (item.video?.playAddr) {
                found = true;
                resultData.type = "video";
                const vUrl = item.video.playAddr;
                resultData.video_url = typeof vUrl === "object" ? (vUrl.urlList?.[0] || vUrl.url_list?.[0]) : vUrl;
            }

            if (item.music?.playUrl) {
                const aUrl = item.music.playUrl;
                resultData.audio_url = typeof aUrl === "object" ? (aUrl.urlList?.[0] || aUrl.url_list?.[0]) : aUrl;
            }
        }
        if (!found) {
            for (const key in obj) findMedia(obj[key]);
        }
    }

    findMedia(data);

    if (!found) {
        throw new Error("Data media tidak ditemukan di objek web TikTok.");
    }

    return resultData;
}

const handler = async (m, { conn, text, args, usedPrefix, command }) => {
    try {
        const input = text || args.join(' ') || (m.quoted && (m.quoted.text || m.quoted.caption)) || '';

        if (!input) {
            return m.reply(`Masukkan URL TikTok.\n\nContoh:\n${usedPrefix + command} https://vt.tiktok.com/ZS4Lu2ran/`);
        }

        const urlMatch = input.match(/https?:\/\/[^\s]+/i);
        if (!urlMatch || (!urlMatch[0].includes("tiktok.com") && !urlMatch[0].includes("vt.tiktok.com"))) {
            return m.reply('Masukkan URL TikTok yang valid!');
        }

        const targetUrl = urlMatch[0];
        await m.reply('> ◦❒ Mengambil data TikTok... ⏳');

        const resData = await fetchTiktok(targetUrl);

        if (!resData || (!resData.video_url && (!resData.images || !resData.images.length))) {
            return m.reply('> ◦❒ Gagal mengambil media dari link TikTok tersebut.');
        }

        const info = resData.metadata || {};
        const title = info.title || "Tanpa Judul";
        const authorNick = info.author?.nickname || info.author?.username || "Unknown";
        const authorUser = info.author?.username || "unknown";
        const views = info.stats?.views?.toLocaleString("id-ID") ?? "0";
        const likes = info.stats?.likes?.toLocaleString("id-ID") ?? "0";
        const comments = info.stats?.comments?.toLocaleString("id-ID") ?? "0";
        const shares = info.stats?.shares?.toLocaleString("id-ID") ?? "0";
        const saves = info.stats?.saves?.toLocaleString("id-ID") ?? "0";

        const caption = `*乂 T I K T O K - D O W N L O A D*\n\n` +
                        `*Title:* ${title}\n` +
                        `*Author:* ${authorNick} (@${authorUser})\n\n` +
                        `*👁 Views:* ${views}\n` +
                        `*❤️ Likes:* ${likes}\n` +
                        `*💬 Comments:* ${comments}\n` +
                        `*🔄 Shares:* ${shares}\n` +
                        `*⭐ Favorites:* ${saves}`;

        // Handler untuk Slide / Carousel Foto
        if (resData.type === "slide" || (Array.isArray(resData.images) && resData.images.length > 0)) {
            async function createImage(url) {
                const { imageMessage } = await generateWAMessageContent({
                    image: { url }
                }, {
                    upload: conn.waUploadToServer
                });
                return imageMessage;
            }

            const cards = [];
            for (let i = 0; i < resData.images.length; i++) {
                cards.push({
                    body: proto.Message.InteractiveMessage.Body.fromObject({
                        text: i === 0 ? caption : `Slide ${i + 1} dari ${resData.images.length}`
                    }),
                    footer: proto.Message.InteractiveMessage.Footer.fromObject({
                        text: `乂 T I K T O K - S L I D E (${i + 1}/${resData.images.length})`
                    }),
                    header: proto.Message.InteractiveMessage.Header.fromObject({
                        hasMediaAttachment: true,
                        imageMessage: await createImage(resData.images[i])
                    }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                        buttons: [{
                            name: "cta_url",
                            buttonParamsJson: JSON.stringify({
                                display_text: "Buka TikTok 🎵",
                                url: targetUrl,
                                merchant_url: targetUrl
                            })
                        }]
                    })
                });
            }

            if (global.Carousel) {
                const carousel = new global.Carousel(conn);
                carousel.setFooter("乂 T I K T O K - C A R O U S E L");
                carousel.addCard(cards);
                await carousel.send(m.chat, { quoted: m });
            } else {
                for (let i = 0; i < resData.images.length; i++) {
                    await conn.sendMessage(m.chat, {
                        image: { url: resData.images[i] },
                        caption: i === 0 ? caption : undefined
                    }, { quoted: m });
                }
            }

            if (resData.audio_url) {
                await conn.sendMessage(m.chat, {
                    audio: { url: resData.audio_url },
                    mimetype: "audio/mpeg",
                    fileName: `${title || 'audio'}.mp3`
                }, { quoted: m });
            }

            return;
        }

        // Handler untuk Video
        if (resData.video_url) {
            try {
                const vidRes = await axios.get(resData.video_url, {
                    responseType: 'arraybuffer',
                    headers: {
                        'User-Agent': UA,
                        'Cookie': resData.cookie || resData.cookieStr || '',
                        'Referer': 'https://www.tiktok.com/',
                        'Accept': '*/*'
                    },
                    timeout: 30000
                });

                await conn.sendMessage(m.chat, {
                    video: Buffer.from(vidRes.data),
                    caption
                }, { quoted: m });
            } catch (_err) {
                await conn.sendMessage(m.chat, {
                    video: { url: resData.video_url },
                    caption
                }, { quoted: m });
            }
        }

        // Kirim audio jika tersedia
        if (resData.audio_url) {
            await conn.sendMessage(m.chat, {
                audio: { url: resData.audio_url },
                mimetype: "audio/mpeg",
                fileName: `${title || 'audio'}.mp3`
            }, { quoted: m });
        }

    } catch (err) {
        console.error('[TIKTOK HANDLER ERROR]:', err);
        return m.reply(`> ◦❒ Terjadi kesalahan: ${err.message || 'Gagal memproses TikTok'}`);
    }
};

handler.help = ["tiktok <url>"];
handler.tags = ["download"];
handler.command = /^(tiktok|tt|ttdl)$/i;
handler.register = true;
handler.limit = true;

export default handler;
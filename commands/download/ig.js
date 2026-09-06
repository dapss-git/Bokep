import axios from "axios";
import {
    proto,
    generateWAMessageContent
} from "baileys";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36";

async function fetchFromAPI(targetUrl) {
    const apiUrl = global.API('theresav', '/download/instagram', {
        url: targetUrl
    });
    const apiKey = (global.API?.getKey ? global.API.getKey('theresav') : null) || global.APIKeys?.['https://api.theresav.eu'] || 'Blck';
    const res = await fetch(apiUrl, {
        headers: {
            'x-apikey': apiKey,
            'apikey': apiKey
        }
    });
    const json = await res.json();
    if (!json?.status || !json?.data) {
        throw new Error(json?.error || json?.message || "Gagal mengambil data dari API.");
    }
    return json.data;
}

async function getGuestSession() {
    const { headers } = await axios.get("https://www.instagram.com/", {
        headers: {
            "user-agent": UA,
            accept: "text/html,application/xhtml+xml",
            "accept-language": "en-US,en;q=0.9",
        },
        timeout: 10000
    });

    const cookies = headers["set-cookie"] || [];
    const cookieStr = cookies.map((c) => c.split(";")[0]).join("; ");
    const csrf = cookieStr.match(/csrftoken=([^;]+)/)?.[1] || "";

    return { cookieStr, csrf };
}

async function fetchFromScraper(url) {
    const match = url.match(/\/(?:reel|p|tv)\/([^/?]+)/);
    if (!match) throw new Error("URL tidak valid.");

    const shortcode = match[1];
    const { cookieStr, csrf } = await getGuestSession();

    const { data: html } = await axios.get(`https://www.instagram.com/p/${shortcode}/`, {
        headers: {
            "user-agent": UA,
            cookie: cookieStr,
        },
        timeout: 10000
    });

    const lsdToken = html.match(/"LSD",\[\],\{"token":"([^"]+)"/)?.[1] || csrf;

    const body = new URLSearchParams({
        lsd: lsdToken,
        variables: JSON.stringify({ shortcode }),
        server_timestamps: "true",
        doc_id: "10015901848480474",
    });

    const { data } = await axios.post(
        "https://www.instagram.com/graphql/query",
        body.toString(),
        {
            headers: {
                "x-ig-app-id": "936619743392459",
                "x-fb-sd": lsdToken,
                "x-csrftoken": csrf,
                "x-requested-with": "XMLHttpRequest",
                "content-type": "application/x-www-form-urlencoded",
                "user-agent": UA,
                cookie: cookieStr,
                referer: `https://www.instagram.com/reel/${shortcode}/`,
                origin: "https://www.instagram.com",
            },
            timeout: 10000
        }
    );

    const media = data?.data?.xdt_shortcode_media;
    if (!media) throw new Error("Media Instagram tidak ditemukan.");

    const children = media.edge_sidecar_to_children?.edges;
    const items = [];
    if (children && children.length > 0) {
        children.forEach((edge) => {
            items.push({
                type: edge.node.is_video ? "video" : "image",
                image: edge.node.display_url,
                ...(edge.node.video_url && { video: edge.node.video_url })
            });
        });
    } else {
        items.push({
            type: media.is_video ? "video" : "image",
            image: media.display_url,
            ...(media.video_url && { video: media.video_url })
        });
    }

    return {
        author: media.owner?.full_name || media.owner?.username || "Instagram User",
        username: media.owner?.username || "unknown",
        likes: media.edge_media_preview_like?.count || 0,
        comments: media.edge_media_to_comment?.count || 0,
        uploadDate: media.taken_at_timestamp ? new Date(media.taken_at_timestamp * 1000).toLocaleDateString('id-ID') : null,
        caption: media.edge_media_to_caption?.edges?.[0]?.node?.text || "-",
        items: items,
    };
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
    try {
        const text = args.join(' ') || (m.quoted && (m.quoted.text || m.quoted.caption));

        if (!text) {
            return m.reply(
                `> ◦❒ *Contoh:* ${usedPrefix + command} https://www.instagram.com/reel/xxxxx/\n` +
                `> ◦❒ Atau reply pesan yang berisi link Instagram`
            );
        }

        const urlMatch = text.match(/https?:\/\/[^\s]+/i);
        if (!urlMatch || !urlMatch[0].includes("instagram.com")) {
            return m.reply('> ◦❒ Masukkan URL instagram.com (Reel/Post/TV) yang valid!');
        }

        const targetUrl = urlMatch[0];
        await m.reply('> ◦❒ Mengambil data media Instagram... ⏳');

        let data;
        try {
            data = await fetchFromAPI(targetUrl);
        } catch (apiErr) {
            console.warn('[INSTAGRAM API FALLBACK]:', apiErr.message);
            data = await fetchFromScraper(targetUrl);
        }

        if (!data || !data.items || !data.items.length) {
            return m.reply('> ◦❒ Gagal mengambil media Instagram: Data media kosong.');
        }

        const authorName = data.author || data.username || data.user?.username || 'Instagram User';
        const likesCount = (data.likes || 0).toLocaleString();
        const commentsCount = (data.comments || 0).toLocaleString();
        const captionText = data.caption && data.caption !== '-' ? (data.caption.length > 100 ? data.caption.slice(0, 97) + '...' : data.caption) : '-';

        const caption = `> ╭─❁ *INSTAGRAM DOWNLOADER* ❁\n` +
                        `> ◦❒ *Author:* @${authorName}\n` +
                        `> ◦❒ *Likes:* ${likesCount}\n` +
                        `> ◦❒ *Komentar:* ${commentsCount}\n` +
                        `> ◦❒ *Tanggal:* ${data.uploadDate || '-'}\n` +
                        `> ◦❒ *Caption:* ${captionText}\n` +
                        `> ╰─❁`;

        // Slide Carousel untuk postingan gambar/media lebih dari 1
        if (data.items.length > 1) {
            async function createImage(url) {
                const { imageMessage } = await generateWAMessageContent({
                    image: { url }
                }, {
                    upload: conn.waUploadToServer
                });
                return imageMessage;
            }

            const cards = [];

            for (let i = 0; i < data.items.length; i++) {
                const item = data.items[i];
                cards.push({
                    body: proto.Message.InteractiveMessage.Body.fromObject({
                        text: i === 0 ? caption : `Media ${i + 1} dari ${data.items.length}`
                    }),
                    footer: proto.Message.InteractiveMessage.Footer.fromObject({
                        text: `乂 I N S T A G R A M - S L I D E (${i + 1}/${data.items.length})`
                    }),
                    header: proto.Message.InteractiveMessage.Header.fromObject({
                        hasMediaAttachment: true,
                        imageMessage: await createImage(item.image)
                    }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                        buttons: [{
                            name: "cta_url",
                            buttonParamsJson: JSON.stringify({
                                display_text: "Buka Instagram 📸",
                                url: targetUrl,
                                merchant_url: targetUrl
                            })
                        }]
                    })
                });
            }

            if (global.Carousel) {
                const carousel = new global.Carousel(conn);
                carousel.setFooter("乂 I N S T A G R A M - C A R O U S E L");
                carousel.addCard(cards);
                await carousel.send(m.chat, { quoted: m });
            } else {
                for (let i = 0; i < data.items.length; i++) {
                    const item = data.items[i];
                    if (item.video) {
                        await conn.sendMessage(m.chat, { video: { url: item.video }, caption: i === 0 ? caption : undefined }, { quoted: m });
                    } else {
                        await conn.sendMessage(m.chat, { image: { url: item.image }, caption: i === 0 ? caption : undefined }, { quoted: m });
                    }
                }
            }
            return;
        }

        // Single Media (Reel Video / Single Photo)
        const item = data.items[0];
        if (item.video) {
            await conn.sendMessage(m.chat, {
                video: { url: item.video },
                caption: caption
            }, { quoted: m });
        } else {
            await conn.sendMessage(m.chat, {
                image: { url: item.image },
                caption: caption
            }, { quoted: m });
        }

    } catch (e) {
        console.error('[INSTAGRAM ERROR]', e);
        const errMessage = e.message || 'Terjadi kesalahan saat mengunduh dari Instagram.';
        await m.reply(`> ◦❒ Gagal memproses Instagram: ${errMessage}`);
    }
};

handler.help = ['instagram', 'ig', 'igdl'];
handler.tags = ['download'];
handler.command = /^(instagram|ig|igdl|reel)$/i;
handler.limit = true;

export default handler;

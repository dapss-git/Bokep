import {
    proto,
    generateWAMessageContent
} from "baileys";

let handler = async (m, { conn, text, args, usedPrefix, command }) => {
    try {
        const input = text || args.join(' ') || (m.quoted && (m.quoted.text || m.quoted.caption)) || '';

        if (!input) {
            return m.reply(
                `> ◦❒ *Contoh:* ${usedPrefix + command} http://xhslink.com/o/4fZNmjzKfte\n` +
                `> ◦❒ Atau reply pesan yang berisi link Xiaohongshu / RedNote`
            );
        }

        const urlMatch = input.match(/https?:\/\/[^\s]+/i);
        if (!urlMatch || (!urlMatch[0].includes("xhslink.com") && !urlMatch[0].includes("xiaohongshu.com"))) {
            return m.reply('> ◦❒ Masukkan URL Xiaohongshu / RedNote (xhslink.com / xiaohongshu.com) yang valid!');
        }

        const targetUrl = urlMatch[0];
        if (global.loading) await global.loading(m, conn);

        const apiUrl = global.API('theresav', '/download/xhs', {
            url: targetUrl
        }, 'apikey');

        const res = await fetch(apiUrl);
        const data = await res.json();

        if (!data?.status) {
            throw new Error(data?.message || 'Gagal mengunduh media dari Xiaohongshu.');
        }

        const title = data.title || '(Tanpa Judul)';
        const author = data.author || 'Unknown';
        const description = data.description || '';
        const stats = data.stats || {};
        const likes = stats.likes || '0';
        const comments = stats.comments || '0';
        const saves = stats.saves || '0';

        let caption = `> ╭─❁ *XIAOHONGSHU / REDNOTE* ❁\n` +
                      `> ◦❒ *Judul:* ${title}\n` +
                      `> ◦❒ *Author:* ${author}\n` +
                      `> ◦❒ *Likes:* ${likes} | *Comments:* ${comments} | *Saves:* ${saves}\n`;

        if (description) {
            caption += `> ◦❒ *Desc:* ${description.slice(0, 100)}${description.length > 100 ? '...' : ''}\n`;
        }
        caption += `> ╰─❁`;

        // 1. Tipe Video
        if (data.type === 'video' && data.video_url) {
            await conn.sendMessage(m.chat, {
                video: { url: data.video_url },
                caption: caption
            }, { quoted: m });
            return;
        }

        // Ambil daftar gambar (baik dari data.images, data.image_urls, atau data.image_url)
        let images = [];
        if (Array.isArray(data.images) && data.images.length > 0) {
            images = data.images;
        } else if (Array.isArray(data.image_urls) && data.image_urls.length > 0) {
            images = data.image_urls;
        } else if (data.image_url) {
            images = [data.image_url];
        }

        if (!images.length) {
            throw new Error('Media tidak ditemukan pada respon Xiaohongshu.');
        }

        // 2. Jika gambar hanya 1
        if (images.length === 1) {
            await conn.sendMessage(m.chat, {
                image: { url: images[0] },
                caption: caption
            }, { quoted: m });
            return;
        }

        // 3. Jika gambar lebih dari 1 -> Gunakan WhatsApp Interactive Carousel Cards
        async function createImage(url) {
            const { imageMessage } = await generateWAMessageContent({
                image: { url }
            }, {
                upload: conn.waUploadToServer
            });
            return imageMessage;
        }

        const cards = [];
        for (let i = 0; i < images.length; i++) {
            cards.push({
                body: proto.Message.InteractiveMessage.Body.fromObject({
                    text: i === 0 ? caption : `Slide ${i + 1} dari ${images.length}`
                }),
                footer: proto.Message.InteractiveMessage.Footer.fromObject({
                    text: `乂 X I A O H O N G S H U (${i + 1}/${images.length})`
                }),
                header: proto.Message.InteractiveMessage.Header.fromObject({
                    hasMediaAttachment: true,
                    imageMessage: await createImage(images[i])
                }),
                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                    buttons: [{
                        name: "cta_url",
                        buttonParamsJson: JSON.stringify({
                            display_text: "Buka Xiaohongshu 📌",
                            url: targetUrl,
                            merchant_url: targetUrl
                        })
                    }]
                })
            });
        }

        if (global.Carousel) {
            const carousel = new global.Carousel(conn);
            carousel.setFooter("乂 X I A O H O N G S H U - C A R O U S E L");
            carousel.addCard(cards);
            await carousel.send(m.chat, { quoted: m });
        } else if (typeof conn.sendAlbumMessage === 'function') {
            const album = images.map((imgUrl, i) => ({
                image: { url: imgUrl },
                caption: i === 0 ? caption : ''
            }));
            await conn.sendAlbumMessage(m.chat, album, {
                quoted: m,
                delay: 500
            });
        } else {
            for (let i = 0; i < images.length; i++) {
                await conn.sendMessage(m.chat, {
                    image: { url: images[i] },
                    caption: i === 0 ? caption : undefined
                }, { quoted: m });
            }
        }

    } catch (e) {
        console.error('[XHS ERROR]', e);
        m.reply(`> ◦❒ Error: ${e.message || 'Terjadi kesalahan saat memproses link Xiaohongshu.'}`);
    } finally {
        if (global.loading) await global.loading(m, conn, true);
    }
};

handler.help = ['xhs <url>', 'xiaohongshu <url>', 'rednote <url>'];
handler.tags = ['download'];
handler.command = /^(xhs|xiaohongshu|rednote|xhsdl)$/i;
handler.limit = true;
handler.register = true;

export default handler;

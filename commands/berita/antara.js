import { prepareWAMessageMedia } from "baileys";

const makeLinkPreview = async (conn, img, title, description, matchedText) => {
    let thumbBuf, image;
    try {
        if (!img) return null;
        if (Buffer.isBuffer(img)) {
            thumbBuf = img;
        } else {
            const res = await fetch(img);
            if (!res.ok) return null;
            thumbBuf = Buffer.from(await res.arrayBuffer());
        }
        const { imageMessage } = await prepareWAMessageMedia({ image: thumbBuf }, { upload: conn.waUploadToServer, mediaTypeOverride: "thumbnail-link" });
        image = imageMessage;
        image.width = 1280;
        image.height = 720;
    } catch (e) {
        console.error(e);
        return null;
    }

    return {
        "matched-text": matchedText,
        title,
        description,
        previewType: 0,
        jpegThumbnail: thumbBuf,
        ...(image ? { highQualityThumbnail: image } : {}),
        linkPreviewMetadata: { linkMediaDuration: 0, socialMediaPostType: 4 }
    };
};

let handler = async (m, { conn, text, usedPrefix, command }) => {
    await global.loading(m, conn);
    try {
        let api = global.API("theresav", "/berita/antara", {}, "apikey");
        let res = await fetch(api);
        let json = await res.json();
        let items = json.items || json.result?.newsList || json.result || [];
        if (!items.length) return m.reply("❌ Berita tidak ditemukan.");

        let headline = items[0];
        let caption = `📰 *Antara News*\n\n`;
        items.slice(0, 10).forEach((v, i) => {
            caption += `*${i + 1}.* ${v.title}\n🔗 ${v.link || v.url}\n\n`;
        });
        caption += `> ${global.footer}`;

        let img = headline.image || headline.thumb || headline.thumbnail || null;
        let linkPreview = img ? await makeLinkPreview(conn, img, headline.title, "Antara News", headline.link || headline.url) : null;

        await conn.sendMessage(m.chat, { text: caption, ...(linkPreview ? { linkPreview } : {}) }, { quoted: m });
    } catch (e) {
        m.reply("❌ Error: " + e.message);
    } finally {
        await global.loading(m, conn, true);
    }
};

handler.help = ["antara"];
handler.tags = ["berita"];
handler.command = /^antara$/i;
handler.register = true;

export default handler;

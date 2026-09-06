import { prepareWAMessageMedia } from "baileys";

const makeLinkPreview = async (conn, img, title, description, matchedText) => {
    let thumbBuf, image;
    try {
        if (Buffer.isBuffer(img)) {
            thumbBuf = img;
        } else {
            const res = await fetch(img);
            thumbBuf = Buffer.from(await res.arrayBuffer());
        }
        const {
            imageMessage
        } = await prepareWAMessageMedia({
            image: thumbBuf
        }, {
            upload: conn.waUploadToServer,
            mediaTypeOverride: "thumbnail-link"
        });
        image = imageMessage;
        image.width = 1280;
        image.height = 720;
    } catch (e) {
        console.error(e);
    }

    return {
        "matched-text": matchedText,
        title,
        description,
        previewType: 0,
        jpegThumbnail: thumbBuf,
        ...(image ? {
            highQualityThumbnail: image
        } : {}),
        linkPreviewMetadata: {
            linkMediaDuration: 0,
            socialMediaPostType: 4
        }
    };
};

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`Contoh:\n${usedPrefix + command} MrBeast`);

    await global.loading(m, conn);

    try {
        let username = text.replace(/@/g, "");
        let api = global.API("theresav", "/stalk/youtube", { username }, "apikey");
        let res = await fetch(api);
        let json = await res.json();

        if (!json?.status || !json?.result?.channelMetadata) {
            return m.reply("❌ Channel tidak ditemukan atau username salah.");
        }

        let r = json.result.channelMetadata;
        let channelUrl = r.channelUrl;

        let caption = `🎥 *YOUTUBE CHANNEL STALK*\n\n`;
        caption += `👤 *Name:* ${r.username}\n`;
        caption += `👥 *Subscribers:* ${r.subscriberCount}\n`;
        caption += `🎬 *Videos:* ${r.videoCount}\n`;
        caption += `🆔 *Channel ID:* ${r.externalId}\n\n`;
        
        caption += `📝 *Description:*\n${r.description.slice(0, 500)}${r.description.length > 500 ? '...' : ''}\n\n`;
        
        if (json.result.videoDataList?.length) {
            caption += `📌 *Latest Videos:*\n`;
            json.result.videoDataList.slice(0, 3).forEach((v, i) => {
                caption += `${i + 1}. ${v.title} (${v.viewCount} views)\n`;
            });
            caption += `\n`;
        }

        caption += `🔗 *Link:* ${channelUrl}\n\n`;
        caption += `> ${global.footer || "Stalker YouTube"}`;

        const linkPreview = await makeLinkPreview(
            conn,
            r.avatarUrl,
            `YouTube: ${r.username}`,
            `${r.subscriberCount} | ${r.videoCount}`,
            channelUrl
        );

        await conn.sendMessage(m.chat, {
            text: caption,
            linkPreview
        }, { quoted: m });

    } catch (e) {
        console.error(e);
        m.reply(`❌ Error: ${e.message}`);
    } finally {
        await global.loading(m, conn, true);
    }
};

handler.help = ["stalkyoutube <username/handle>"];
handler.tags = ["stalk"];
handler.command = /^(stalkyt|stalkyoutube|youtubestalk)$/i;

handler.register = true

export default handler;

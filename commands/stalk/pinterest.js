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
        return null;
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
    if (!text) return m.reply(`Contoh:\n${usedPrefix + command} Chisa24`);

    await global.loading(m, conn);

    try {
        let api = global.API("theresav", "/stalk/pinterest", { username: text }, "apikey");
        let res = await fetch(api);
        let json = await res.json();

        if (!json?.status || !json?.result) {
            return m.reply("❌ User tidak ditemukan atau username salah.");
        }

        let r = json.result;
        let stats = r.stats;

        let caption = `📌 *PINTEREST STALK*\n\n`;
        caption += `👤 *Name:* ${r.full_name || "N/A"}\n`;
        caption += `🏷️ *Username:* ${r.username}\n`;
        caption += `📍 *Location:* ${r.location || "N/A"}\n`;
        caption += `✅ *Verified:* ${r.is_verified ? "Yes" : "No"}\n\n`;
        
        caption += `📝 *Bio:*\n${r.bio || "No bio"}\n\n`;
        
        caption += `📊 *Stats:*\n`;
        caption += `• Pins: ${stats.pins}\n`;
        caption += `• Followers: ${stats.followers}\n`;
        caption += `• Following: ${stats.following}\n`;
        caption += `• Boards: ${stats.boards}\n\n`;

        caption += `🔗 *Link:* ${r.profile_url}\n\n`;
        caption += `> ${global.footer || "Stalker Pinterest"}`;

        let profilePic = r.image.original || r.image.large || r.image.medium || r.image.small;
        
        let linkPreview = null;
        if (profilePic) {
            linkPreview = await makeLinkPreview(
                conn,
                profilePic,
                `Pinterest: ${r.full_name || r.username}`,
                `Pins: ${stats.pins} | Followers: ${stats.followers}`,
                r.profile_url
            );
        }

        await conn.sendMessage(m.chat, {
            text: caption,
            ...(linkPreview ? { linkPreview } : {})
        }, { quoted: m });

    } catch (e) {
        console.error(e);
        m.reply(`❌ Error: ${e.message}`);
    } finally {
        await global.loading(m, conn, true);
    }
};

handler.help = ["stalkpin <username>"];
handler.tags = ["stalk"];
handler.command = /^(stalkpin|stalkpinterest|pinstalk)$/i;

handler.register = true

export default handler;

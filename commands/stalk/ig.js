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
    if (!text) return m.reply(`Contoh:\n${usedPrefix + command} blckrose0`);

    await global.loading(m, conn);

    try {
        let username = text.replace(/@/g, "").trim();
        let api = global.API("theresav", "/stalk/ig", { username }, "apikey");
        console.log("IG Stalk API:", api);
        let res = await fetch(api);
        let json = await res.json();
        console.log("IG Stalk Response:", JSON.stringify(json));

        if (!json?.status || !json?.result) {
            return m.reply("❌ User tidak ditemukan atau username salah.");
        }

        let r = json.result;
        let profileUrl = `https://www.instagram.com/${r.username}`;

        let caption = `📸 *INSTAGRAM STALK*\n\n`;
        caption += `👤 *Name:* ${r.fullName || "N/A"}\n`;
        caption += `🏷️ *Username:* @${r.username}\n`;
        caption += `✅ *Verified:* ${r.isVerified ? "Yes" : "No"}\n`;
        caption += `🔒 *Private:* ${r.isPrivate ? "Yes" : "No"}\n\n`;
        
        caption += `📝 *Bio:*\n${r.biography || "No bio"}\n\n`;
        
        caption += `📊 *Stats:*\n`;
        caption += `• Posts: ${r.postsCount}\n`;
        caption += `• Followers: ${r.followedCount}\n`;
        caption += `• Following: ${r.followCount}\n\n`;

        caption += `🔗 *Link:* ${profileUrl}\n\n`;
        caption += `> ${global.footer || "Stalker IG"}`;

        const linkPreview = await makeLinkPreview(
            conn,
            r.profilePicUrl,
            `Instagram: ${r.fullName || r.username}`,
            `Followers: ${r.followedCount} | Following: ${r.followCount}`,
            profileUrl
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

handler.help = ["stalkig <username>"];
handler.tags = ["stalk"];
handler.command = /^(stalkig|igstalk)$/i;

handler.register = true

export default handler;

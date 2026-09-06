import { prepareWAMessageMedia } from "baileys";
import fs from "fs";

const makeLinkPreview = async (conn, img, title, description, matchedText) => {
    let thumbBuf, image;
    try {
        if (Buffer.isBuffer(img)) {
            thumbBuf = img;
        } else if (img && typeof img === 'string' && img.startsWith('http')) {
            const res = await fetch(img);
            thumbBuf = Buffer.from(await res.arrayBuffer());
        } else {
            thumbBuf = fs.readFileSync("./src/avatar_contact.png");
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
        try {
            thumbBuf = fs.readFileSync("./src/avatar_contact.png");
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
        } catch (err) {
            console.error(err);
        }
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

let handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {
    if (!text) return m.reply(`Contoh:\n${usedPrefix + command} cecilia.yahuk`);

    const username = text.trim().replace(/@/g, "");

    try {
        await global.loading(m, conn);
        let api = global.API("theresav", "/stalk/tiktok", { username }, "apikey");
        let res = await fetch(api);
        let json = await res.json();

        if (!json?.status || !json?.result) {
            return m.reply("❌ User tidak ditemukan atau username salah.");
        }

        let r = json.result;
        let p = r.profile;
        let s = r.stats;
        const tiktokUrl = p.url || `https://www.tiktok.com/@${username}`;
        
        let caption = `📸 *TIKTOK STALK*\n\n`;
        caption += `👤 *Name:* ${p.nickname || "N/A"}\n`;
        caption += `🏷️ *Username:* @${p.username}\n`;
        caption += `✅ *Verified:* ${p.verified ? "Yes" : "No"}\n`;
        caption += `🔒 *Private:* ${p.privateAccount ? "Yes" : "No"}\n\n`;
        
        caption += `📝 *Bio:*\n${p.bio || "No bio"}\n\n`;

        caption += `📊 *Stats:*\n`;
        caption += `• Followers: ${s.followers}\n`;
        caption += `• Following: ${s.following}\n`;
        caption += `• Likes: ${s.likes}\n`;
        caption += `• Video Count: ${s.videos}\n\n`;

        caption += `🔗 *Link:* ${tiktokUrl}\n\n`;
        caption += `> ${global.footer || "Stalker TikTok"}`;

        const linkPreview = await makeLinkPreview(
            conn,
            p.avatar?.large || p.avatar?.medium || p.avatar?.thumb,
            `TikTok: ${p.nickname || p.username}`,
            `Followers: ${s.followers} | Likes: ${s.likes}`,
            tiktokUrl
        );

        await conn.sendMessage(m.chat, {
            text: caption,
            linkPreview
        }, {
            quoted: m
        });
    } catch (error) {
        console.error(error);
        m.reply(`❌ Terjadi kesalahan: ${error.message || error}`);
    } finally {
        await global.loading(m, conn, true);
    }
};

handler.help = ["tiktokstalk <username>"];
handler.tags = ["stalk"];
handler.command = /^(tiktokstalk|ttstalk)$/i;
handler.description = "Stalk profil TikTok berdasarkan username.";
handler.register = true;

export default handler;

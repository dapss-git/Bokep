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
    if (!text) return m.reply(`Contoh:\n${usedPrefix + command} jokowi`);

    await global.loading(m, conn);

    try {
        let username = text.replace(/@/g, "");
        let api = global.API("theresav", "/stalk/twitterstalk", { username }, "apikey");
        let res = await fetch(api);
        let json = await res.json();

        if (!json?.status || !json?.result) {
            return m.reply("❌ User tidak ditemukan atau username salah.");
        }

        let r = json.result.profile;
        let profileUrl = `https://twitter.com/${r.username.replace('@', '')}`;

        let caption = `🐦 *TWITTER STALK*\n\n`;
        caption += `👤 *Name:* ${r.name}\n`;
        caption += `🏷️ *Username:* ${r.username}\n`;
        caption += `📍 *Location:* ${r.location || "N/A"}\n`;
        caption += `📅 *Joined:* ${r.joined}\n\n`;
        
        caption += `📝 *Bio:*\n${r.bio || "No bio"}\n\n`;
        
        caption += `📊 *Stats:*\n`;
        caption += `• Followers: ${r.followers}\n`;
        caption += `• Following: ${r.following}\n\n`;

        if (json.result.tweets?.length) {
            caption += `📌 *Latest Tweet:*\n`;
            let tweet = json.result.tweets[0];
            caption += `"${tweet.text.slice(0, 200)}${tweet.text.length > 200 ? '...' : ''}"\n`;
            caption += `❤️ ${tweet.stats.likes} | 🔁 ${tweet.stats.reposts} | 💬 ${tweet.stats.replies}\n\n`;
        }

        caption += `🔗 *Link:* ${profileUrl}\n\n`;
        caption += `> ${global.footer || "Stalker Twitter"}`;

        const linkPreview = await makeLinkPreview(
            conn,
            r.avatar,
            `Twitter: ${r.name}`,
            r.bio,
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

handler.help = ["stalktwitter <username>"];
handler.tags = ["stalk"];
handler.command = /^(stalktwit|stalktwitter|twitterstalk)$/i;

handler.register = true

export default handler;

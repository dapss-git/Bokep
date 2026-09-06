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
    if (!text) return m.reply(`Contoh:\n${usedPrefix + command} Blckrose2`);

    await global.loading(m, conn);

    try {
        let api = global.API("theresav", "/stalk/github", { username: text }, "apikey");
        let res = await fetch(api);
        let json = await res.json();

        if (!json?.status || !json?.result) {
            return m.reply("❌ User tidak ditemukan atau username salah.");
        }

        let r = json.result;

        let caption = `🐙 *GITHUB STALK*\n\n`;
        caption += `👤 *Name:* ${r.name || "N/A"}\n`;
        caption += `🏷️ *Username:* ${r.login}\n`;
        caption += `📍 *Location:* ${r.location || "N/A"}\n`;
        caption += `📧 *Email:* ${r.email || "N/A"}\n`;
        caption += `🔗 *Blog/Web:* ${r.blog || "N/A"}\n\n`;
        
        caption += `📝 *Bio:*\n${r.bio || "No bio"}\n\n`;
        
        caption += `📊 *Stats:*\n`;
        caption += `• Public Repos: ${r.public_repos}\n`;
        caption += `• Public Gists: ${r.public_gists}\n`;
        caption += `• Followers: ${r.followers}\n`;
        caption += `• Following: ${r.following}\n\n`;

        caption += `📅 *Joined:* ${new Date(r.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}\n`;
        caption += `⏰ *Last Update:* ${new Date(r.updated_at).toLocaleString('id-ID')}\n\n`;

        caption += `🔗 *Link:* ${r.profile_url}\n\n`;
        caption += `> ${global.footer || "Stalker GitHub"}`;

        let linkPreview = await makeLinkPreview(
            conn,
            r.avatar_url,
            `GitHub: ${r.name || r.login}`,
            `Repos: ${r.public_repos} | Followers: ${r.followers}`,
            r.profile_url
        );

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

handler.help = ["stalkgithub <username>"];
handler.tags = ["stalk"];
handler.command = /^(stalkgh|stalkgithub|githubstalk)$/i;

handler.register = true

export default handler;

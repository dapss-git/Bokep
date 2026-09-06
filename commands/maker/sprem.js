import {
    generateWAMessageFromContent,
    prepareWAMessageMedia,
    downloadContentFromMessage,
} from "baileys";

function buildStickerExif(metadata) {
    const json = Buffer.from(JSON.stringify(metadata), "utf-8");
    const exif = Buffer.concat([
        Buffer.from([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00]),
        Buffer.alloc(4),
        Buffer.from([0x16, 0x00, 0x00, 0x00]),
        json,
    ]);
    exif.writeUInt32LE(json.length, 14);
    return exif;
}

function makeChunk(type, data) {
    const typeBuffer = Buffer.from(type);
    const sizeBuffer = Buffer.alloc(4);
    sizeBuffer.writeUInt32LE(data.length, 0);
    const padding = data.length % 2 === 1 ? Buffer.from([0x00]) : Buffer.alloc(0);
    return Buffer.concat([typeBuffer, sizeBuffer, data, padding]);
}

function setWebpExif(webpBuffer, metadata) {
    if (webpBuffer.slice(0, 4).toString() !== "RIFF" || webpBuffer.slice(8, 12).toString() !== "WEBP") {
        throw new Error("File bukan WEBP valid.");
    }
    const chunks = [];
    let offset = 12;
    while (offset + 8 <= webpBuffer.length) {
        const type = webpBuffer.slice(offset, offset + 4).toString();
        const size = webpBuffer.readUInt32LE(offset + 4);
        const chunkStart = offset;
        const chunkEnd = offset + 8 + size + (size % 2);
        if (chunkEnd > webpBuffer.length) break;
        if (type !== "EXIF") chunks.push(webpBuffer.slice(chunkStart, chunkEnd));
        offset = chunkEnd;
    }
    const exifPayload = buildStickerExif(metadata);
    const exifChunk = makeChunk("EXIF", exifPayload);
    const body = Buffer.concat([...chunks, exifChunk]);
    const header = Buffer.alloc(12);
    header.write("RIFF", 0);
    header.writeUInt32LE(body.length + 4, 4);
    header.write("WEBP", 8);
    return Buffer.concat([header, body]);
}

async function downloadStickerBuffer(stickerMessage) {
    const stream = await downloadContentFromMessage(stickerMessage, "sticker");
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
}

let handler = async (m, {
    conn
}) => {
    try {
        let quoted = m.quoted || m;
        let stickerMessage = quoted.message?.stickerMessage || quoted?.stickerMessage;

        if (!stickerMessage || stickerMessage.mimetype !== "image/webp") {
            return m.reply("❌ Reply sticker WEBP biasa.");
        }

        await m.reply("⏳ Processing...");

        let stickerBuffer = await downloadStickerBuffer(stickerMessage);

        let metadata = {
            "is-avatar-sticker": 1,
            premium: 1,
            emojis: ["⭐"]
        };

        let finalStickerBuffer = setWebpExif(stickerBuffer, metadata);
        let media = await prepareWAMessageMedia({
            sticker: finalStickerBuffer
        }, {
            upload: conn.waUploadToServer
        });

        let msgContent = {
            stickerMessage: {
                ...media.stickerMessage,
                isAnimated: false,
                isAvatar: true,
                isAiSticker: true,
            }
        };

        let msg = await generateWAMessageFromContent(m.chat, msgContent, {
            quoted: m,
            userJid: conn.user.id
        });
        await conn.relayMessage(m.chat, msg.message, {
            messageId: msg.key.id
        });
        await m.react('✅');
    } catch (e) {
        console.error(e);
        m.reply("❌ Gagal.");
        await m.react('❌');
    }
};

handler.command = /^(sprem)$/i;
handler.help = ['sprem'];
handler.tags = ['maker'];
handler.limit = true
handler.register = true;

export default handler;
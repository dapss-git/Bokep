import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { tmpdir } from 'os';

const MIME_EXT = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/mpeg": "mpeg",
    "video/3gpp": "3gp",
    "audio/ogg": "ogg",
    "audio/ogg; codecs=opus": "ogg",
    "audio/mpeg": "mp3",
    "audio/mp4": "m4a",
    "audio/aac": "aac",
    "audio/wav": "wav",
};

function getExt(mime = "") {
    const clean = mime.split(";")[0].trim().toLowerCase();
    return MIME_EXT[clean] || clean.split("/")[1] || "bin";
}

function unwrapMessage(raw = {}) {
    const layers = [
        "ephemeralMessage", "viewOnceMessage", "viewOnceMessageV2",
        "documentWithCaptionMessage", "editedMessage",
        "forwardedNewsletterMessageInfo" // ← newsletter forward wrapper
    ];
    let msg = raw;
    for (const layer of layers) {
        if (msg?.[layer]?.message) msg = msg[layer].message;
    }
    return msg || raw;
}

function detectMedia(mmsg) {
    const m = unwrapMessage(mmsg);
    if (m.imageMessage) return {
        type: "image",
        msg: m.imageMessage,
        raw: m
    };
    if (m.videoMessage) return {
        type: "video",
        msg: m.videoMessage,
        raw: m
    };
    if (m.ptvMessage) return {
        type: "ptv",
        msg: m.ptvMessage,
        raw: m
    };
    if (m.audioMessage) return {
        type: "audio",
        msg: m.audioMessage,
        raw: m
    };
    if (m.stickerMessage) return {
        type: "sticker",
        msg: m.stickerMessage,
        raw: m
    };
    return null;
}

function convertToOpus(input, output) {
    return new Promise((resolve, reject) =>
        ffmpeg(input)
        .toFormat("opus").audioCodec("libopus").audioBitrate("64k")
        .on("end", resolve).on("error", reject).save(output)
    );
}

let handler = async (m, {
    conn,
    usedPrefix,
    command
}) => {
    const q = m.quoted ? m.quoted : m;
    const mmsg = q.message || {};

    const detected = detectMedia(mmsg);
    if (!detected) {
        return m.reply(
            `❌ Reply media yang ingin diupload ke channel!\n` +
            `Media yang didukung: *foto, video, audio, voice, sticker, ptv*\n` +
            `Cara: reply media lalu ketik *${usedPrefix + command}*`
        );
    }

    const {
        type,
        msg
    } = detected;
    const mime = msg.mimetype || "";
    const ext = getExt(mime);
    const base = `${m.sender.split("@")[0]}_${Date.now()}`;
    const chJid = global.idch;

    if (!chJid) return m.reply("❌ global.idch belum diset di settings.js!");

    const inputPath = path.join(tmpdir(), `${base}.${ext}`);
    const opusPath = path.join(tmpdir(), `${base}.opus`);

    await m.reply(`🔄 *${type}* diterima, sedang diproses...`);

    try {
        const buffer = await q.download();
        fs.writeFileSync(inputPath, buffer);

        switch (type) {

            case "image": {
                await m.reply("⏳ Mengupload foto ke channel...");
                await conn.sendMessage(chJid, {
                    image: fs.readFileSync(inputPath),
                    mimetype: mime || "image/jpeg",
                    caption: msg.caption || ""
                });
                break;
            }

            case "video": {
                await m.reply("⏳ Mengupload video ke channel...");
                await conn.sendMessage(chJid, {
                    video: fs.readFileSync(inputPath),
                    mimetype: mime || "video/mp4",
                    caption: msg.caption || ""
                });
                break;
            }

            case "ptv": {
                await m.reply("⏳ Mengupload PTV ke channel...");
                await conn.sendMessage(chJid, {
                    video: fs.readFileSync(inputPath),
                    mimetype: mime || "video/mp4",
                    ptv: true
                });
                break;
            }

            case "sticker": {
                await m.reply("⏳ Mengupload sticker ke channel...");
                await conn.sendMessage(chJid, {
                    sticker: fs.readFileSync(inputPath),
                    mimetype: mime || "image/webp"
                });
                break;
            }

            case "audio": {
                await m.reply("⏳ Mengkonversi & mengupload audio ke channel...");
                const isOpus = mime.includes("opus") || ["ogg", "opus"].includes(ext);
                if (!isOpus) await convertToOpus(inputPath, opusPath);
                else fs.copyFileSync(inputPath, opusPath);

                await conn.sendMessage(chJid, {
                    audio: fs.readFileSync(opusPath),
                    mimetype: "audio/ogg; codecs=opus",
                    ptt: true
                });
                break;
            }
        }

        await m.reply(`✅ *${type}* berhasil diupload ke channel!`);

    } catch (e) {
        console.error("[uploadch]", e);
        m.reply(`❌ Gagal memproses ${type}: ${e.message || e}`);
    } finally {
        for (const f of [inputPath, opusPath]) {
            try {
                if (fs.existsSync(f)) fs.unlinkSync(f);
            } catch {}
        }
    }
};

handler.command = ["upch", "sendch"];
handler.tags = ["owner"];
handler.description = "Upload foto/video/audio/voice/sticker/ptv ke channel. Reply media lalu ketik command.";
handler.owner = true;
handler.register = true;

export default handler;
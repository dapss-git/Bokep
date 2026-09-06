import { writeExif } from '../../library/exif.js';
import fs from 'fs';
import path from 'path';

let handler = async (m, {
    conn,
    args,
    usedPrefix,
    command
}) => {
    try {
        let [packname, ...author] = args.join(' ').split('|');
        packname = packname || global.packname || global.wm || '';
        author = (author || []).join('|') || global.author || '';

        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || q.mediaType || '';

        if (!mime) return m.reply(`Reply image/video/sticker\nContoh: ${usedPrefix + command}`);

        await global.loading(m, conn);

        // Lottie / premium sticker relay
        if (mime === 'application/was' || (q.msg || q).isLottie) {
            let stickerMsg = q.msg || q;
            await conn.relayMessage(m.chat, {
                lottieStickerMessage: {
                    message: {
                        stickerMessage: {
                            url: stickerMsg.url,
                            fileSha256: stickerMsg.fileSha256,
                            fileEncSha256: stickerMsg.fileEncSha256,
                            mediaKey: stickerMsg.mediaKey,
                            mimetype: 'application/was',
                            height: stickerMsg.height || 64,
                            width: stickerMsg.width || 64,
                            directPath: stickerMsg.directPath,
                            fileLength: stickerMsg.fileLength,
                            mediaKeyTimestamp: stickerMsg.mediaKeyTimestamp,
                            isAnimated: stickerMsg.isAnimated ?? true,
                            stickerSentTs: String(Date.now()),
                            isAvatar: stickerMsg.isAvatar ?? false,
                            isAiSticker: stickerMsg.isAiSticker ?? false,
                            isLottie: true
                        }
                    }
                }
            }, {});
            return;
        }

        let media = await q.download?.();
        if (!media) throw new Error('Gagal download media');

        let stiker = await writeExif(media, {
            packname,
            author,
            name: m.name,
            cropToSquare: command.includes('crop') || command.includes('circle')
        });

        await conn.sendMessage(m.chat, {
            sticker: stiker
        }, {
            quoted: m
        });

    } catch (e) {
        console.error(e);
        m.reply('Error: ' + e.message);
    } finally {
        await global.loading(m, conn, true);
    }
};

handler.help = ['sticker', 'scrop'];
handler.tags = ['maker'];
handler.command = /^s(tic?ker)?(gif)?(crop)?$/i;
handler.register = true;

export default handler;
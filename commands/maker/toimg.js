import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

let handler = async (m, {
    conn,
    usedPrefix,
    command
}) => {
    let notMakerMessage = `Reply maker dengan command ${usedPrefix + command}`;
    let q = m.quoted || m;

    const isMaker =
        q?.mtype === 'stickerMessage' ||
        q?.type === 'stickerMessage' ||
        q?.message?.stickerMessage;

    if (!isMaker) return m.reply(notMakerMessage);

    await global.loading(m, conn);

    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

    const input = path.join(tmpDir, `${Date.now()}.webp`);
    const output = path.join(tmpDir, `${Date.now()}.jpg`);

    try {
        const media = await q.download();
        fs.writeFileSync(input, media);

        // Check if sticker is animated
        const isAnimated = isAnimatedWebP(media);

        if (isAnimated) {
            // For animated stickers, extract first frame
            await sharp(input, {
                    animated: true
                })
                .jpeg({
                    quality: 90
                })
                .toFile(output);
            m.reply('⚠️ Sticker animated, hanya frame pertama yang diekstrak');
        } else {
            // Convert WEBP → JPG pakai sharp
            await sharp(input)
                .jpeg({
                    quality: 90
                })
                .toFile(output);
        }

        const img = fs.readFileSync(output);
        await conn.sendFile(m.chat, img, 'toimg.jpg', '', m);

    } catch (e) {
        console.error('ERROR TOIMG:', e);
        m.reply('Gagal convert sticker ke image');
    } finally {
        if (fs.existsSync(input)) fs.unlinkSync(input);
        if (fs.existsSync(output)) fs.unlinkSync(output);
        await global.loading(m, conn, true);
    }
};

handler.help = ['toimg'];
handler.tags = ['maker'];
handler.command = ['toimg', 'toimage'];
handler.register = true;

export default handler;

// Helper function to detect animated WebP
function isAnimatedWebP(buf) {
    if (!buf || buf.length < 12) return false;

    const riff = buf.toString('ascii', 0, 4);
    const webp = buf.toString('ascii', 8, 12);
    if (riff !== 'RIFF' || webp !== 'WEBP') return false;

    let offset = 12;
    while (offset < buf.length - 8) {
        const fourCC = buf.toString('ascii', offset, offset + 4);
        const chunkSize = buf.readUInt32LE(offset + 4);

        if (fourCC === 'VP8X') {
            const flagsOffset = offset + 8;
            if (flagsOffset < buf.length && (buf[flagsOffset] & 0x02)) {
                return true;
            }
        } else if (fourCC === 'ANIM' || fourCC === 'ANMF') {
            return true;
        }

        offset += 8 + chunkSize + (chunkSize % 2);
    }

    return false;
}
import fs from 'fs';
import { exec } from 'child_process';
import { tmpdir } from 'os';
import crypto from 'crypto';
import { addExif } from '../../library/sticker.js';

// Helper function to convert image to webp
const imageToWebp = (buffer) => {
    return new Promise((resolve, reject) => {
        const tmp = tmpdir();
        const filename = crypto.randomBytes(6).toString('hex');
        const inputPath = `${tmp}/${filename}.png`;
        const outputPath = `${tmp}/${filename}.webp`;

        fs.writeFileSync(inputPath, buffer);
        exec(`ffmpeg -y -i "${inputPath}" -vf "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease" "${outputPath}"`, (err) => {
            fs.unlinkSync(inputPath);
            if (err) reject(err);
            else {
                const webpBuffer = fs.readFileSync(outputPath);
                fs.unlinkSync(outputPath);
                resolve(webpBuffer);
            }
        });
    });
};

let handler = async (m, { conn, text, usedPrefix, command }) => {
    try {
        // Check if user replied to a message
        if (!m.quoted) {
            return m.reply(`Reply an image with command ${usedPrefix + command}\n\nExample: ${usedPrefix + command} MyPack|MyAuthor`);
        }

        let [packname, ...author] = (text || '').split('|');
        packname = (packname || '').trim();
        author = author.join('|').trim();

        // Use default watermark if not provided
        if (!packname) packname = global.wm || 'Sticker';
        if (!author) author = global.author || '';

        let q = m.quoted;
        let mime = (q.msg || q).mimetype || q.mediaType || '';

        // Check if the quoted message is an image
        if (!/image/.test(mime)) {
            return m.reply('Please reply to an image!');
        }

        await global.loading(m, conn);

        // Download the image
        let img = await q.download();
        if (!img) {
            return m.reply('Failed to download image');
        }

        // Convert image to webp and add exif watermark
        let webp = await imageToWebp(img);
        let sticker = await addExif(webp, packname, author, ['🤩', '🔥']);

        // Send the sticker
        await conn.sendMessage(
            m.chat,
            {
                sticker: sticker
            },
            {
                quoted: m
            }
        );

    } catch (error) {
        console.error('Error in swm handler:', error);
        m.reply('An error occurred while creating the sticker');
    } finally {
        await global.loading(m, conn, true);
    }
};

handler.help = ['swm <pack>|<author>'];
handler.tags = ['maker'];
handler.command = ['swm'];
handler.register = true;

export default handler;

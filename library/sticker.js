import webp from 'node-webpmux';
import { Sticker } from 'wa-sticker-formatter';

/**
 * Detect if a WebP buffer contains animation
 * Checks for VP8X chunk with animation flag or ANIM/ANMF chunks
 * @param {Buffer} buf - WebP buffer
 * @returns {boolean} - True if animated WebP
 */
function isAnimatedWebP(buf) {
    if (!buf || buf.length < 12) return false;
    
    // Check if it's a valid WebP file
    const riff = buf.toString('ascii', 0, 4);
    const webp = buf.toString('ascii', 8, 12);
    if (riff !== 'RIFF' || webp !== 'WEBP') return false;
    
    let offset = 12;
    while (offset < buf.length - 8) {
        const fourCC = buf.toString('ascii', offset, offset + 4);
        const chunkSize = buf.readUInt32LE(offset + 4);
        
        if (fourCC === 'VP8X') {
            // Check animation flag (bit 1) in VP8X chunk
            const flagsOffset = offset + 8;
            if (flagsOffset < buf.length && (buf[flagsOffset] & 0x02)) {
                return true;
            }
        } else if (fourCC === 'ANIM' || fourCC === 'ANMF') {
            // ANIM or ANMF chunks indicate animation
            return true;
        }
        
        // Move to next chunk (chunk size + 8 bytes header, padded to even)
        offset += 8 + chunkSize + (chunkSize % 2);
    }
    
    return false;
}

// Fungsi untuk membuat stiker
async function sticker(img, url, packName, authorName) {
    try {
        const stickerMetadata = {
            type: 'full',
            pack: packName,
            author: authorName,
        };
        const stickerInstance = new Sticker(img || url, stickerMetadata);
        await stickerInstance.build();
        return await stickerInstance.toBuffer();
    } catch (error) {
        console.error('Error in sticker function:', error);
        throw error;
    }
}

// Fungsi untuk membuat ID stiker unik tanpa crypto
function generateStickerId() {
    const timestamp = Date.now().toString(16); // timestamp dalam hex
    const randomPart = Math.floor(Math.random() * 1e8).toString(16); // angka acak
    return timestamp + randomPart;
}

// Fungsi untuk menambahkan metadata EXIF ke stiker
async function addExif(webpSticker, packname, author, categories = [''], extra = {}) {
    try {
        const img = new webp.Image();

        // Gunakan ID unik tanpa crypto
        const stickerPackId = generateStickerId();

        const json = {
            'sticker-pack-id': stickerPackId,
            'sticker-pack-name': packname,
            'sticker-pack-publisher': author,
            'emojis': categories,
            ...extra
        };

        const exifAttr = Buffer.from([
            0x49, 0x49, 0x2A, 0x00,
            0x08, 0x00, 0x00, 0x00,
            0x01, 0x00, 0x41, 0x57,
            0x07, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x16, 0x00,
            0x00, 0x00
        ]);

        const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
        const exif = Buffer.concat([exifAttr, jsonBuffer]);
        exif.writeUIntLE(jsonBuffer.length, 14, 4);

        await img.load(webpSticker);
        img.exif = exif;
        return await img.save(null);

    } catch (error) {
        console.error('Error in addExif function:', error);
        throw error;
    }
}

export {
    sticker,
    addExif,
    isAnimatedWebP
};
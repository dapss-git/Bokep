/**
 * Judul  : Spotify Downloader (Scrape spotidown.app)
 * Base   : spotidown.app
 * Credit : t.me/Velzyguy (scraper), TheresavBackup (struktur)
 * Command: spotify3
 */

import {
    prepareWAMessageMedia
} from "baileys";
import axios from "axios";
import * as cheerio from "cheerio";

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ========== Scraper dari splay.js (dikonversi ke ESM) ==========
async function scrapeSpotiDown(query) {
    const resHome = await axios.get('https://spotidown.app/en6', {
        headers: {
            'User-Agent': USER_AGENT
        }
    });

    const cookies = resHome.headers['set-cookie'] || [];
    const cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');

    const $1 = cheerio.load(resHome.data);
    const hiddenInputs = {};
    $1('form[name="spotifyurl"] input[type="hidden"]').each((_, el) => {
        const name = $1(el).attr('name');
        const val = $1(el).attr('value') || '';
        if (name) hiddenInputs[name] = val;
    });

    const paramsAction = new URLSearchParams();
    paramsAction.append('url', query);
    for (const [k, v] of Object.entries(hiddenInputs)) {
        paramsAction.append(k, v);
    }

    const resAction = await axios.post('https://spotidown.app/action', paramsAction.toString(), {
        headers: {
            'User-Agent': USER_AGENT,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Cookie': cookieHeader,
            'Referer': 'https://spotidown.app/en6',
            'Origin': 'https://spotidown.app',
            'X-Requested-With': 'XMLHttpRequest'
        }
    });

    const responseData = typeof resAction.data === 'string' ? JSON.parse(resAction.data) : resAction.data;

    if (responseData.error) {
        throw new Error(responseData.message || 'Gagal mencari lagu');
    }

    const $2 = cheerio.load(responseData.data);
    const firstForm = $2('form[name="submitspurl"]').first();

    if (!firstForm.length) {
        throw new Error('Lagu tidak ditemukan');
    }

    const rawData = firstForm.find('input[name="data"]').val();
    const baseVal = firstForm.find('input[name="base"]').val();
    const tokenVal = firstForm.find('input[name="token"]').val();

    let trackMeta = {};
    if (rawData) {
        try {
            const decoded = Buffer.from(rawData, 'base64').toString('utf-8');
            trackMeta = JSON.parse(decoded);
        } catch (e) {
            // ignore
        }
    }

    const paramsTrack = new URLSearchParams();
    paramsTrack.append('data', rawData);
    paramsTrack.append('base', baseVal);
    paramsTrack.append('token', tokenVal);

    let downloadUrl = null;
    const resTrack = await axios.post('https://spotidown.app/action/track', paramsTrack.toString(), {
        headers: {
            'User-Agent': USER_AGENT,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Cookie': cookieHeader,
            'Referer': 'https://spotidown.app/en6',
            'Origin': 'https://spotidown.app',
            'X-Requested-With': 'XMLHttpRequest'
        }
    });

    const trackRespData = typeof resTrack.data === 'string' ? JSON.parse(resTrack.data) : resTrack.data;
    if (!trackRespData.error && trackRespData.data) {
        const $dl = cheerio.load(trackRespData.data);
        downloadUrl = $dl('a.abutton[href]').attr('href') || null;
    }

    return {
        title: trackMeta.name || null,
        artist: trackMeta.artist || null,
        album: trackMeta.album || null,
        duration: trackMeta.duration || null,
        image: trackMeta.cover || null,
        download_url: downloadUrl
    };
}

// ========== Link Preview Helper ==========
const makeLinkPreview = async (conn, imgUrl, title, description) => {
    let thumbBuf, image;
    try {
        const res = await fetch(imgUrl);
        thumbBuf = Buffer.from(await res.arrayBuffer());
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
    } catch (e) {}

    return {
        "matched-text": imgUrl,
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

// ========== Handler ==========
let handler = async (m, {
    conn,
    text,
    usedPrefix
}) => {
    if (!text)
        return m.reply(`Masukkan URL Spotify atau judul lagu.\n\nContoh:\n${usedPrefix}spotify3 https://open.spotify.com/track/xxx\n${usedPrefix}spotify3 Gala Bunga Matahari`);

    await global.loading(m, conn);

    try {
        const result = await scrapeSpotiDown(text);

        if (!result || !result.download_url) {
            throw new Error("Link download tidak ditemukan dari scraper.");
        }

        const artistName = result.artist || "Unknown";

        let caption = `🎧 *SPOTIFY DOWNLOADER*\n\n` +
            `📌 *Judul:* ${result.title || '-'}\n` +
            `👤 *Artis:* ${artistName}\n` +
            `💿 *Album:* ${result.album || '-'}\n` +
            `⏱️ *Durasi:* ${result.duration || '-'}`;

        // Kirim link preview info
        if (result.image) {
            const linkPreview = await makeLinkPreview(
                conn,
                result.image,
                result.title || 'Spotify Track',
                `${artistName} • ${result.duration || ''} • Spotify`
            );

            await conn.sendMessage(m.chat, {
                text: `${result.image}\n\n${caption}`,
                linkPreview
            }, {
                quoted: m
            });
        } else {
            await m.reply(caption);
        }

        // Download & kirim audio
        const audioRes = await fetch(result.download_url);
        if (!audioRes.ok) {
            throw new Error(`Download gagal (${audioRes.status})`);
        }

        const audioBuffer = Buffer.from(await audioRes.arrayBuffer());

        await conn.sendMessage(m.chat, {
            audio: audioBuffer,
            mimetype: "audio/mpeg",
            fileName: `${result.title || 'track'}.mp3`,
            ptt: false
        }, {
            quoted: m
        });

    } catch (e) {
        console.error(e);
        m.reply(`❌ Error: ${e.message}`);
    } finally {
        await global.loading(m, conn, true);
    }
};

handler.help = ["spotify3 <query/url>"];
handler.tags = ["downloader"];
handler.command = /^(spotify3|spdl3)$/i;
handler.limit = true;
handler.register = true;

export default handler;
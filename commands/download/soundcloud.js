import {
    prepareWAMessageMedia
} from 'baileys';

let cachedClientId = null;
let lastClientIdFetch = 0;

async function getSoundCloudClientId(html) {
    const now = Date.now();
    if (cachedClientId && (now - lastClientIdFetch < 3600000)) {
        return cachedClientId;
    }

    try {
        const scriptMatches = [...html.matchAll(/<script[^>]+src="(https:\/\/[^"]+\.js)"/g)].map(m => m[1]);
        for (const sUrl of scriptMatches.reverse()) {
            try {
                const sRes = await fetch(sUrl);
                const sText = await sRes.text();
                const match = sText.match(/client_id:"([a-zA-Z0-9]{32})"/);
                if (match) {
                    cachedClientId = match[1];
                    lastClientIdFetch = now;
                    return cachedClientId;
                }
            } catch {}
        }
    } catch (e) {
        console.error('[SOUNDCLOUD CLIENT_ID ERROR]', e);
    }
    return cachedClientId;
}

async function extractSoundCloudTrack(trackUrl) {
    const res = await fetch(trackUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });

    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const html = await res.text();

    const hydraMatch = html.match(/window\.__sc_hydration\s*=\s*(\[.*?\]);\s*<\/script>/s);
    if (!hydraMatch) throw new Error('Data track tidak ditemukan.');

    const hydraData = JSON.parse(hydraMatch[1]);
    const soundData = hydraData.find(item => item.hydratable === 'sound')?.data;
    if (!soundData) throw new Error('Sound data tidak ditemukan.');

    const clientId = await getSoundCloudClientId(html);
    if (!clientId) throw new Error('Gagal mendapatkan akses client_id SoundCloud.');

    const transcodings = soundData.media?.transcodings || [];
    const progMp3 = transcodings.find(t => t.format?.protocol === 'progressive') || transcodings[0];

    if (!progMp3) throw new Error('Format audio tidak didukung.');

    const streamInfoRes = await fetch(`${progMp3.url}?client_id=${clientId}`);
    const streamJson = await streamInfoRes.json();

    if (!streamJson?.url) throw new Error('Gagal mengekstrak URL stream audio.');

    return {
        title: soundData.title || 'SoundCloud Track',
        artist: soundData.user?.username || 'Unknown Artist',
        thumbnail: soundData.artwork_url ? soundData.artwork_url.replace('-large', '-t500x500') : '',
        duration: soundData.duration || 0,
        streamUrl: streamJson.url
    };
}

const makeLinkPreview = async (conn, imgUrl, title, description) => {
    let thumbBuf, image;
    try {
        if (imgUrl) {
            const res = await fetch(imgUrl);
            if (res.ok) {
                thumbBuf = Buffer.from(await res.arrayBuffer());
                const {
                    imageMessage
                } = await prepareWAMessageMedia({
                    image: thumbBuf
                }, {
                    upload: conn.waUploadToServer,
                    mediaTypeOverride: 'thumbnail-link'
                });
                image = imageMessage;
                image.width = 1280;
                image.height = 720;
            }
        }
    } catch (e) {}

    return {
        'matched-text': imgUrl || 'https://soundcloud.com',
        title: title || 'SoundCloud',
        description: description || 'SoundCloud Audio',
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
    if (!text) {
        return m.reply(
            `> ◦❒ *Contoh Download:* ${usedPrefix + command} https://soundcloud.com/artist/track\n` +
            `> ◦❒ *Contoh Search:* ${usedPrefix + command} alan walker faded`
        );
    }

    const isUrl = /(https?:\/\/(?:www\.|on\.|m\.)?soundcloud\.com\/[^\s]+)/i.test(text);

    if (global.loading) await global.loading(m, conn);

    try {
        if (isUrl) {
            // Mode Download URL SoundCloud
            const match = text.match(/(https?:\/\/(?:www\.|on\.|m\.)?soundcloud\.com\/[^\s]+)/i);
            const targetUrl = match ? match[0] : text;

            const data = await extractSoundCloudTrack(targetUrl);
            const durationMin = data.duration ? `${Math.floor(data.duration / 60000)}:${Math.floor((data.duration % 60000) / 1000).toString().padStart(2, '0')}` : '-';

            const caption = `> ╭─❁ *SOUNDCLOUD DOWNLOADER* ❁\n` +
                            `> ◦❒ *Judul:* ${data.title}\n` +
                            `> ◦❒ *Artis:* ${data.artist}\n` +
                            `> ◦❒ *Durasi:* ${durationMin}\n` +
                            `> ╰─❁`;

            if (data.thumbnail) {
                const linkPreview = await makeLinkPreview(
                    conn,
                    data.thumbnail,
                    data.title,
                    `${data.artist} • ${durationMin} • SoundCloud`
                );

                await conn.sendMessage(m.chat, {
                    text: `${data.thumbnail}\n\n${caption}`,
                    linkPreview
                }, {
                    quoted: m
                });
            } else {
                await m.reply(caption);
            }

            const audioRes = await fetch(data.streamUrl);
            if (!audioRes.ok) throw new Error('Gagal mengunduh file audio.');
            const audioBuffer = Buffer.from(await audioRes.arrayBuffer());

            await conn.sendMessage(m.chat, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                fileName: `${data.title}.mp3`,
                ptt: false
            }, {
                quoted: m
            });

        } else {
            // Mode Search SoundCloud via API Theresav
            const searchUrl = global.API('theresav', '/search/soundcloud', {
                query: text
            }, 'apikey');

            let res = await fetch(searchUrl);
            let json = await res.json();

            let tracks = (json?.status && Array.isArray(json?.result)) ? json.result : [];

            if (!tracks.length) {
                return m.reply(`> ◦❒ Tidak ditemukan lagu untuk pencarian *"${text}"*.`);
            }

            const rows = tracks.slice(0, 10).map((v, i) => {
                const title = v.title || 'SoundCloud Track';
                const artist = v.artist || 'Unknown';
                
                return {
                    header: `Track ${i + 1}`,
                    title: title.length > 35 ? title.substring(0, 35) + '...' : title,
                    description: `👤 ${artist}`,
                    id: `${usedPrefix + command} ${v.url}`
                };
            });

            return conn.sendMessage(m.chat, {
                text: `> ╭─❁ *SOUNDCLOUD SEARCH* ❁\n` +
                      `> ◦❒ *Query:* ${text}\n` +
                      `> ◦❒ *Total:* ${rows.length} Lagu\n` +
                      `> ╰─❁\n\n` +
                      `_Pilih lagu di bawah ini untuk mengunduh:_`,
                footer: global.botname || 'SoundCloud',
                buttons: [{
                    buttonId: 'sc_select',
                    buttonText: {
                        displayText: '🎵 Pilih Lagu'
                    },
                    type: 4,
                    nativeFlowInfo: {
                        name: 'single_select',
                        paramsJson: JSON.stringify({
                            title: 'Daftar Lagu SoundCloud',
                            sections: [{
                                title: `Hasil: ${text}`,
                                rows
                            }]
                        })
                    }
                }],
                headerType: 1,
                viewOnce: true
            }, {
                quoted: m
            });
        }

    } catch (e) {
        console.error('[SOUNDCLOUD ERROR]', e);
        m.reply(`> ◦❒ Error: ${e.message || 'Terjadi kesalahan saat memproses SoundCloud.'}`);
    } finally {
        if (global.loading) await global.loading(m, conn, true);
    }
};

handler.help = ['soundcloud <query/url>', 'scdl <url>'];
handler.tags = ['downloader', 'search'];
handler.command = /^(soundcloud|scdl|sc)$/i;
handler.limit = true;
handler.register = true;

export default handler;

import {
    prepareWAMessageMedia
} from "baileys";
import {
    canvas as searchCanvas
} from "../../library/canvas/canvas-spsearch.js";

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

let handler = async (m, {
    conn,
    text,
    usedPrefix
}) => {
    if (!text)
        return m.reply(`Contoh:\n${usedPrefix}spotify consume\n${usedPrefix}spotify <url>`);

    await global.loading(m, conn);

    try {
        const isUrl = text.includes("http");

        if (!isUrl) {
            let api = global.API("theresav", "/search/spotify", {
                query: text
            }, "apikey");

            let res = await fetch(api);
            let json = await res.json();

            if (!json?.status || !json?.result?.length) {
                return m.reply("❌ Tidak ada hasil ditemukan.");
            }

            let tracks = json.result;

            let imageBuffer = await searchCanvas(tracks, text);

            let rows = tracks.slice(0, 10).map(v => ({
                header: Array.isArray(v.artists) ? v.artists.join(', ') : (v.artists || "-"),
                title: `🎵 ${v.name || v.title}`,
                description: `⏱️ ${v.duration}`,
                id: `.spotify ${v.spotifyUrl || v.spotify_url || v.url}`
            }));

            return conn.sendMessage(m.chat, {
                image: imageBuffer,
                caption: `🎧 *Spotify Search*\nQuery: *${text}*`,
                footer: "Klik untuk download lagu",
                buttons: [{
                    buttonId: "spotify_select",
                    buttonText: {
                        displayText: "📥 Pilih Lagu"
                    },
                    type: 4,
                    nativeFlowInfo: {
                        name: "single_select",
                        paramsJson: JSON.stringify({
                            title: "Hasil Spotify",
                            sections: [{
                                title: "List Lagu",
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

        let api = global.API("theresav", "/download/spotify", {
            url: text
        }, "apikey");

        let res = await fetch(api);
        let json = await res.json();

        if (!json?.status || !json?.result) {
            throw new Error("API tidak valid");
        }

        let r = json.result;

        let downloadLink = r.downloadUrl || r.download_url || r.url;
        if (!downloadLink) {
            throw new Error("Link download lagu tidak ditemukan.");
        }

        let audioRes = await fetch(downloadLink);
        if (!audioRes.ok) {
            throw new Error(`Download gagal (${audioRes.status})`);
        }

        let audioBuffer = Buffer.from(await audioRes.arrayBuffer());
        const artistName = Array.isArray(r.artists) ? r.artists.join(', ') : (r.artists || r.artist || "Unknown");

        // Format Info & Lirik Timestamp
        const syncedLyrics = r.lyrics?.syncedLyrics;
        const plainLyrics = r.lyrics?.plainLyrics;
        const lyricsText = syncedLyrics || plainLyrics;

        let caption = `🎧 *SPOTIFY DOWNLOADER*\n\n` +
                      `📌 *Judul:* ${r.title}\n` +
                      `👤 *Artis:* ${artistName}\n` +
                      `⏱️ *Durasi:* ${r.duration || '-'}\n` +
                      `💿 *Album:* ${r.album?.name || '-'}\n` +
                      `📅 *Rilis:* ${r.release_date || '-'}`;

        if (lyricsText) {
            caption += `\n\n*LYRICS*\n\n${lyricsText.trim()}`;
        }

        // Kirim link preview kartu info + lirik
        if (r.cover) {
            const linkPreview = await makeLinkPreview(
                conn,
                r.cover,
                r.title,
                `${artistName} • ${r.duration || ''} • Spotify`
            );

            await conn.sendMessage(m.chat, {
                text: `${r.cover}\n\n${caption}`,
                linkPreview
            }, {
                quoted: m
            });
        } else {
            await m.reply(caption);
        }

        // Kirim file audio MP3
        await conn.sendMessage(m.chat, {
            audio: audioBuffer,
            mimetype: "audio/mpeg",
            fileName: `${r.title || 'track'}.mp3`,
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

handler.help = ["spotify <query/url>"];
handler.tags = ["search", "downloader"];
handler.command = /^(spotify|spotdl)$/i;
handler.limit = true;
handler.register = true;

export default handler;
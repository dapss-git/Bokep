import {
    prepareWAMessageMedia
} from 'baileys';

const bitrates = ['64', '128', '192', '256', '320'];

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
            mediaTypeOverride: 'thumbnail-link'
        });
        image = imageMessage;
        image.width = 1280;
        image.height = 720;
    } catch (e) {}

    return {
        'matched-text': imgUrl,
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

const handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {

    if (text?.startsWith('res|')) {
        let [, bitrate, ...urlParts] = text.split('|');
        const url = urlParts.join('|');
        bitrate = String(parseInt(bitrate));

        if (!bitrates.includes(bitrate)) {
            return m.reply('Bitrate tidak tersedia!');
        }

        try {
            await global.loading(m, conn);

            const apiUrl = global.API('theresav', '/download/ytmp3', {
                url,
                format: 'mp3',
                bitrate: `${bitrate}k`
            });

            const res = await fetch(apiUrl);
            const data = await res.json();

            if (!data?.status || !data?.download_url) {
                return m.reply(`❌ ${data?.error || data?.message || 'Gagal download audio 😢'}`);
            }

            const filesizeMB = data.filesize ? (data.filesize / 1024 / 1024).toFixed(2) : '-';

            // Kirim Kartu Link Preview dengan Thumbnail YouTube
            if (data.thumbnail) {
                const linkPreview = await makeLinkPreview(
                    conn,
                    data.thumbnail,
                    data.title,
                    `${data.channel || 'YouTube'} • ${bitrate}kbps • ${filesizeMB} MB`
                );

                const infoText = `🎵 *${data.title}*\n\n` +
                                 `👤 *Channel:* ${data.channel || '-'}\n` +
                                 `⏱️ *Durasi:* ${data.duration_sec ? `${data.duration_sec}s` : '-'}\n` +
                                 `🎚️ *Bitrate:* ${data.bitrate || `${bitrate}k`}\n` +
                                 `📦 *Ukuran:* ${filesizeMB} MB\n` +
                                 `👍 *Like:* ${data.like_count || 0}\n` +
                                 `👁️ *View:* ${data.view_count || 0}`;

                await conn.sendMessage(m.chat, {
                    text: `${data.thumbnail}\n\n${infoText}`,
                    linkPreview
                }, {
                    quoted: m
                });
            }

            // Kirim Audio MP3
            const audioRes = await fetch(data.download_url);
            if (!audioRes.ok) throw new Error(`Gagal mengunduh audio (${audioRes.status})`);
            const audioBuffer = Buffer.from(await audioRes.arrayBuffer());

            await conn.sendMessage(m.chat, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                fileName: `${data.title || 'audio'}_${bitrate}k.mp3`,
                ptt: false
            }, {
                quoted: m
            });

        } catch (e) {
            console.error(e);
            m.reply(`❌ Terjadi error saat download: ${e.message}`);
        } finally {
            await global.loading(m, conn, true);
        }
        return;
    }

    if (!text || !text.startsWith('http')) {
        return m.reply(
            `Contoh:\n${usedPrefix + command} https://youtu.be/zMMWzvtYgQY`
        );
    }

    const rows = bitrates.map(b => ({
        title: `${b}k`,
        description: `Download audio ${b}k`,
        id: `${usedPrefix + command} res|${b}|${text}`
    }));

    await conn.sendMessage(
        m.chat, {
            text: '📥 Pilih bitrate audio',
            footer: 'YouTube Audio Downloader',
            buttons: [{
                buttonId: 'yta_res_select',
                buttonText: {
                    displayText: '🎵 Pilih Bitrate'
                },
                type: 4,
                nativeFlowInfo: {
                    name: 'single_select',
                    paramsJson: JSON.stringify({
                        title: 'Pilih Bitrate Audio',
                        sections: [{
                            title: 'Bitrate Tersedia',
                            rows
                        }]
                    })
                }
            }],
            headerType: 1,
            viewOnce: true
        }, {
            quoted: m
        }
    );
};

handler.help = ['yta <link>'];
handler.tags = ['downloader'];
handler.command = /^(yta|ytmp3)$/i;
handler.limit = true;
handler.register = true;
export default handler;
const resolutions = ['360', '480', '720', '1080'];

const handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {

    if (text?.startsWith('res|')) {
        let [, resolution, ...urlParts] = text.split('|');
        const url = urlParts.join('|');
        resolution = String(parseInt(resolution));

        if (!resolutions.includes(resolution)) {
            return m.reply('Resolusi tidak tersedia!');
        }

        try {
            await global.loading(m, conn);

            const apiUrl = global.API('theresav', '/download/ytmp4', {
                url,
                resolution
            });

            const res = await fetch(apiUrl);
            const data = await res.json();

            if (!data?.status || !data?.download_url) {
                return m.reply(`❌ ${data?.error || data?.message || 'Gagal download video dari API'}`);
            }

            const caption = `🎬 *${data.title}*\n\n` +
                            `👤 *Channel:* ${data.channel || '-'}\n` +
                            `⏱️ *Durasi:* ${data.duration_sec ? `${data.duration_sec}s` : '-'}\n` +
                            `📺 *Resolusi:* ${data.resolution}p\n` +
                            `📦 *Ukuran:* ${data.filesize ? `${(data.filesize / 1024 / 1024).toFixed(2)} MB` : '-'}\n` +
                            `👍 *Like:* ${data.like_count || 0}\n` +
                            `👁️ *View:* ${data.view_count || 0}`;

            await conn.sendFile(
                m.chat,
                data.download_url,
                `${data.title || 'video'}_${data.resolution}p.mp4`,
                caption,
                m
            );

        } catch (e) {
            console.error(e);
            m.reply(`❌ Terjadi error saat download: ${e.message}`);
        } finally {
            await global.loading(m, conn, true);
        }
        return;
    }

    if (!text || !text.startsWith('http')) {
        return m.reply(`Contoh:\n${usedPrefix + command} https://youtu.be/zMMWzvtYgQY`);
    }

    await new Button(conn)
        .setTitle('📥 YouTube Downloader')
        .setBody('Pilih resolusi video:')
        .setFooter('YouTube Downloader')
        .addSelection('🎞 Pilih Resolusi')
        .makeSection('Resolusi Tersedia')
        .makeRow('', '360p', 'Download video 360p', `${usedPrefix + command} res|360|${text}`)
        .makeRow('', '480p', 'Download video 480p', `${usedPrefix + command} res|480|${text}`)
        .makeRow('', '720p', 'Download video 720p', `${usedPrefix + command} res|720|${text}`)
        .makeRow('', '1080p', 'Download video 1080p', `${usedPrefix + command} res|1080|${text}`)
        .send(m.chat, {
            quoted: m
        });
};

handler.help = ['ytmp4 <link>'];
handler.tags = ['downloader'];
handler.command = /^(ytv|ytmp4)$/i;
handler.limit = true;
handler.register = true;

export default handler;
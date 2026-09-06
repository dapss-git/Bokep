let handler = async (m, {
    conn,
    args,
    text,
    usedPrefix,
    command
}) => {
    if (!text) return m.reply(`Masukkan URL MediaFire!\n\nContoh: ${usedPrefix}${command} https://www.mediafire.com/file/xyz`);

    try {
        global.loading(m, conn);
        const apiUrl = global.API('theresav', '/download/mediafire', {
            url: text
        }, 'apikey');

        const res = await fetch(apiUrl);
        const data = await res.json();

        if (data.status && data.result) {
            const {
                fileName,
                fileSize,
                directDownloadUrl
            } = data.result;

            let caption = `*MediaFire Downloader*\n\n`;
            caption += `*File Name:* ${fileName}\n`;
            caption += `*File Size:* ${fileSize}\n\n`;

            await conn.sendMessage(m.chat, {
                text: caption + `_Mengirim file..._`,
                quoted: m
            });

            const ext = fileName.split('.').pop().toLowerCase();

            const imageExt = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            const videoExt = ['mp4', 'mkv', 'avi', 'mov'];
            const audioExt = ['mp3', 'wav', 'ogg', 'm4a'];

            let message = {};

            if (imageExt.includes(ext)) {
                message = {
                    image: {
                        url: directDownloadUrl
                    },
                    caption: fileName
                };
            } else if (videoExt.includes(ext)) {
                message = {
                    video: {
                        url: directDownloadUrl
                    },
                    caption: fileName
                };
            } else if (audioExt.includes(ext)) {
                message = {
                    audio: {
                        url: directDownloadUrl
                    },
                    mimetype: 'audio/mpeg',
                    fileName: fileName
                };
            } else {
                message = {
                    document: {
                        url: directDownloadUrl
                    },
                    fileName: fileName,
                    mimetype: 'application/octet-stream'
                };
            }

            await conn.sendMessage(m.chat, message, {
                quoted: m
            });

            global.loading(m, conn, true);

        } else {
            global.loading(m, conn, true);
            m.reply(`Terjadi kesalahan: ${data.message || 'Gagal mengunduh dari MediaFire.'}`);
        }
    } catch (error) {
        global.loading(m, conn, true);
        console.error(error);
        m.reply(`Terjadi kesalahan saat memproses permintaan: ${error}`);
    }
};

handler.help = ["mediafire <url>"];
handler.tags = ["downloader"];
handler.command = /^(mediafire|mf)$/i;
handler.description = "Download files from MediaFire.";
handler.register = true;
handler.limit = true;

export default handler;
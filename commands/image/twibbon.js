import * as jimp from 'jimp';

let handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {
    try {
        // Ambil gambar dari reply
        let q = m.quoted ? m.quoted : m;
        if (!q.msg || !q.msg.image) {
            return m.reply(`Balas gambar dengan perintah ${usedPrefix + command}`);
        }

        global.loading(m, conn);

        // Ambil buffer gambar
        const imageBuffer = await q.download?.() || await q.download?.image();
        if (!imageBuffer) {
            global.loading(m, conn, true);
            return m.reply('Gagal mengunduh gambar.');
        }

        const FRAME_URL = "https://files.clugx.my.id/ehmVW.png";

        async function makeTwibbon(userPhotoBuffer) {
            const user = await jimp.read(userPhotoBuffer);
            user.resize(1080, 1080);

            const frameResponse = await fetch(FRAME_URL);
            const frameBuffer = await frameResponse.arrayBuffer();
            const frame = await jimp.read(Buffer.from(frameBuffer));
            frame.resize(1080, 1080);

            user.composite(frame, 0, 0);
            return await user.getBufferAsync(jimp.MIME_PNG);
        }

        const resultImageBuffer = await makeTwibbon(imageBuffer);

        await conn.sendMessage(
            m.chat, {
                image: resultImageBuffer,
                caption: 'Twibbon berhasil dibuat!'
            }, {
                quoted: m
            }
        );

        global.loading(m, conn, true);

    } catch (error) {
        global.loading(m, conn, true);
        console.error(error);
        return m.reply(`Terjadi kesalahan: ${error.message}`);
    }
};

handler.help = ['twibbon (reply gambar)'];
handler.tags = ['image'];
handler.command = /^twibbon$/i;
handler.description = 'Membuat twibbon dari gambar dengan cara membalas gambar.';
handler.limit = true;
handler.register = true;

export default handler;
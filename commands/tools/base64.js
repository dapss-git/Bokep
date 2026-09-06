import {
    Buffer
} from 'node:buffer';

let handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {
    handler.register = true;

    try {
        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || '';

        if (/image/.test(mime)) {
            global.loading(m, conn);

            const buffer = await q.download();
            const base64 = buffer.toString('base64');

            global.loading(m, conn, true);

            return m.reply(base64);
        }

        let input = text || (m.quoted && m.quoted.text);

        if (input) {
            const isBase64 = /^[A-Za-z0-9+/=]+$/.test(input);

            if (!isBase64) {
                return m.reply('Teks bukan base64 yang valid.');
            }

            global.loading(m, conn);

            const buffer = Buffer.from(input, 'base64');

            global.loading(m, conn, true);

            return await conn.sendMessage(m.chat, {
                image: buffer,
                caption: 'Hasil decode base64'
            }, {
                quoted: m
            });
        }

        return m.reply(
            `Gunakan:\n` +
            `1. Reply gambar → encode ke base64\n` +
            `2. Kirim / reply teks base64 → decode jadi gambar`
        );

    } catch (e) {
        console.error(e);
        return m.reply('Terjadi kesalahan saat memproses.');
    }
};

handler.help = ['base64'];
handler.tags = ['tools'];
handler.command = /^base64$/i;
handler.description = 'Encode/Decode base64 (gambar).';
handler.limit = true;

export default handler;
let handler = async (m, {
    conn
}) => {
    const q = m.quoted ? m.quoted : m;
    const mime = (q.msg || q).mimetype || '';

    if (!mime.startsWith('image/')) {
        return m.reply('Reply atau kirim gambar dengan caption perintah.');
    }

    await m.reply('⏳ Processing image...');

    try {
        const image = await q.download();

        const blob = new Blob([image], {
            type: mime
        });

        const form = new FormData();
        form.append('image', blob, 'image.jpg');
        form.append('apikey', global.APIKeys[global.APIs['theresav']]);

        const url = global.API(
            'theresav',
            '/image/lumiart', {},
            'apikey'
        );

        const res = await fetch(url, {
            method: 'POST',
            body: form
        });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        const buffer = Buffer.from(await res.arrayBuffer());

        await conn.sendMessage(
            m.chat, {
                image: buffer,
                caption: '✨ Successfully generated with LumiArt'
            }, {
                quoted: m
            }
        );

    } catch (e) {
        console.error(e);
        await m.reply(`❌ Error: ${e.message}`);
    }
};

handler.help = ['lumiart'];
handler.tags = ['image'];
handler.command = /^lumiart$/i;

handler.register = true;
handler.premium = true;

export default handler;
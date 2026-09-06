let handler = async (m, {
    conn
}) => {
    const q = m.quoted ? m.quoted : m;
    const mime = (q.msg || q).mimetype || '';

    if (!mime.startsWith('image/')) {
        return m.reply('❌ Reply image');
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
            '/nsfw/deepnudes', {},
            'apikey'
        );

        const res = await fetch(url, {
            method: 'POST',
            body: form
        });

        if (!res.ok) {
            throw await res.text();
        }

        const buffer = Buffer.from(await res.arrayBuffer());

        await conn.sendMessage(m.chat, {
            image: buffer,
            caption: '✅ Success'
        }, {
            quoted: m
        });

    } catch (e) {
        console.error(e);
        m.reply('❌ Failed process image');
    }
};

handler.help = ['deepnude'];
handler.tags = ['nsfw'];
handler.command = ['deepnude', 'deepnudes'];
handler.nsfw = true
handler.premium = true;
handler.limit = true;

export default handler;
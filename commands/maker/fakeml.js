let handler = async (m, {
    conn,
    args,
    usedPrefix,
    command
}) => {

    if (!args[0]) {
        return m.reply(`Masukkan nickname + reply gambar!\n\nContoh:\n${usedPrefix + command} rose`);
    }

    let nickname = args.join(" ");
    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || "";

    if (!/image\/(jpe?g|png|webp)/.test(mime)) {
        return m.reply(`Reply gambar dengan ${usedPrefix + command}`);
    }

    await m.reply('⏳ Processing Fakeml...');

    try {
        let media = await q.download();
        if (!media) throw new Error('Gagal download media');

        const blob = new Blob([media], {
            type: 'image/jpeg'
        });

        const form = new FormData();
        form.append('avatar', blob, 'avatar.jpg');
        form.append('nickname', nickname);
        form.append('apikey', global.APIKeys[global.APIs['theresav']]);

        const url = global.APIs['theresav'] + '/canvas/fakeml';

        const res = await fetch(url, {
            method: 'POST',
            body: form
        });

        const contentType = res.headers.get('content-type') || '';

        if (!contentType.includes('image')) {
            const txt = await res.text();
            throw new Error(txt);
        }

        const buffer = Buffer.from(await res.arrayBuffer());

        await conn.sendMessage(m.chat, {
            image: buffer,
            caption: `FakeML Card • ${nickname}`
        }, {
            quoted: m
        });

    } catch (e) {
        console.error(e);
        m.reply(`Error: ${e.message}`);
    }
};

handler.help = ['fakeml'];
handler.tags = ['maker'];
handler.command = /^(fakeml)$/i;
handler.limit = true;
handler.register = true;

export default handler;
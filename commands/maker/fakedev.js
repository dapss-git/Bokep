let handler = async (m, {
    conn,
    args,
    usedPrefix,
    command
}) => {

    let text = args.join(" ");
    if (!text.includes("|")) {
        return m.reply(`Masukkan format yang benar + reply gambar!\n\nContoh:\n${usedPrefix + command} Rose|true`);
    }

    let [name, verified] = text.split("|");
    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || "";

    if (!/image\/(jpe?g|png|webp)/.test(mime)) {
        return m.reply(`Reply gambar dengan ${usedPrefix + command}`);
    }

    await m.reply('⏳ Processing Fakedev...');

    try {
        let media = await q.download();
        if (!media) throw new Error('Gagal download media');

        const blob = new Blob([media], {
            type: 'image/jpeg'
        });

        const form = new FormData();
        form.append('image', blob, 'image.jpg');
        form.append('name', name.trim());
        form.append('verified', verified.trim());
        form.append('apikey', 'Blckrose');

        const url = 'https://api.theresav.biz.id/canvas/fakedev';

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
            caption: `Fakedev • ${name.trim()}`
        }, {
            quoted: m
        });

    } catch (e) {
        console.error(e);
        m.reply(`Error: ${e.message}`);
    }
};

handler.help = ['fakedev'];
handler.tags = ['maker'];
handler.command = /^(fakedev)$/i;
handler.limit = true;
handler.register = true;

export default handler;

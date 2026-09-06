let handler = async (m, {
    conn,
    usedPrefix,
    command
}) => {
    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || q.mediaType || '';

    if (!/pdf/i.test(mime)) {
        return m.reply(`Reply file PDF dengan ${usedPrefix + command}`);
    }

    await m.reply('⏳ Converting PDF to image...');

    try {
        let media = await q.download();
        if (!media) throw new Error('Gagal download file');

        const blob = new Blob([media], {
            type: 'application/pdf'
        });

        const form = new FormData();
        form.append('file', blob, 'file.pdf');
        form.append('apikey', global.APIKeys[global.APIs['theresav']]);

        const res = await fetch(global.APIs['theresav'] + '/tools/pdftoimage', {
            method: 'POST',
            body: form
        });

        const json = await res.json();

        if (!json.status) {
            throw new Error(JSON.stringify(json));
        }

        const {
            zipUrl,
            thumbUrl,
            sid,
            fid
        } = json.result;

        const thumbRes = await fetch(thumbUrl);
        const thumbBuffer = Buffer.from(await thumbRes.arrayBuffer());

        await conn.sendMessage(m.chat, {
            image: thumbBuffer,
            caption: `✅ PDF berhasil di convert!\n\n` +
                `🆔 SID: ${sid}\n` +
                `📁 FID: ${fid}\n\n` +
                `📦 ZIP Download:\n${zipUrl}`
        }, {
            quoted: m
        });

    } catch (e) {
        console.error(e);
        m.reply(`Error: ${e.message}`);
    }
};

handler.help = ['pdftoimage'];
handler.tags = ['tools'];
handler.command = /^pdftoimage$/i;
handler.limit = true;
handler.register = true;

export default handler;
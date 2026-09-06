import {
    sticker
} from '../../library/sticker.js';

let handler = async (m, {
    conn,
    args,
    text,
    usedPrefix,
    command
}) => {
    let input = text || args.join(' ');
    if (!input) {
        return m.reply(
            `Masukkan teks untuk stiker Brat!\n\nContoh:\n${usedPrefix + command} Halo Brat`
        );
    }

    try {
        global.loading(m, conn);

        let apiUrl = global.API('theresav', '/maker/brat', { text: input });
        let res = await fetch(apiUrl);

        if (!res.ok) {
            global.loading(m, conn, true);
            return m.reply('Gagal mengambil stiker dari API');
        }

        let buffer = await res.arrayBuffer();
        let stiker = await sticker(
            Buffer.from(buffer),
            false,
            global.wm,
            global.author
        );

        if (!stiker) {
            global.loading(m, conn, true);
            return m.reply('Gagal membuat stiker.');
        }

        global.loading(m, conn, true);
        return conn.sendFile(
            m.chat,
            stiker,
            'BratSticker.webp',
            '',
            m
        );

    } catch (e) {
        global.loading(m, conn, true);
        console.error('[BRAT ERROR]:', e);
        return m.reply('Gagal membuat stiker, coba lagi nanti.');
    }
};

handler.help = ['brat'];
handler.tags = ['maker'];
handler.command = /^(brat)$/i;
handler.limit = true;
handler.register = true;

export default handler;
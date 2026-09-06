import axios from 'axios';

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`Masukkan kueri pencarian!\n\nContoh: *${usedPrefix + command} Apa itu cryptocurrency?*`);
    await global.loading(m, conn);
    try {
        const url = global.API('theresav', '/ai/xdash', { text }, 'apikey');
        const { data } = await axios.get(url);
        if (!data.status) return m.reply('Maaf, terjadi kesalahan pada server AI.');
        let result = data.result || data.data;
        if (typeof result === 'object') {
            if ('text' in result) result = result.text;
            else if ('answer' in result) result = result.answer;
            else if ('message' in result) result = result.message;
            else if ('reply' in result) result = result.reply;
            else result = JSON.stringify(result, null, 2);
        }
        await m.reply(result);
    } catch (e) {
        console.error(`AI ERROR (${command}):`, e?.response?.data || e.message);
        m.reply('Gagal mendapatkan respon dari AI.');
    } finally {
        global.loading(m, conn, true);
    }
};

handler.help = ['xdash <teks>'];
handler.command = /^xdash$/i;
handler.tags = ['ai'];
handler.limit = true;

handler.register = true

export default handler;

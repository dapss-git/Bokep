import axios from 'axios';

let handler = async (m, { text, usedPrefix, command }) => {
    if (!text) return m.reply(`Masukkan kueri pencarian!\n\nContoh: *${usedPrefix + command} tutorial nodejs*`);
    await global.loading(m, conn);
    try {
        const url = global.API('theresav', '/search/brave', { q: text }, 'apikey');
        const { data } = await axios.get(url);
        if (!data.status || !data.result?.length) return m.reply('Tidak ditemukan hasil.');
        
        let teks = `*Brave Search:* _${text}_\n\n`;
        for (let v of data.result.slice(0, 5)) {
            teks += `*${v.title}*\n`;
            teks += `◦ Link: ${v.link}\n`;
            teks += `◦ Snippet: ${v.snippet || '-'}\n\n`;
        }
        await m.reply(teks);
    } catch (e) {
        console.error(`SEARCH ERROR (${command}):`, e?.response?.data || e.message);
        m.reply('Gagal melakukan pencarian.');
    } finally {
        global.loading(m, conn, true);
    }
};

handler.help = ['brave <kueri>'];
handler.command = /^brave$/i;
handler.tags = ['search'];
handler.limit = true;

handler.register = true

export default handler;

import axios from 'axios';

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`Masukkan deskripsi gambar yang ingin dibuat!\n\nContoh: *${usedPrefix + command} cyberpunk city landscape*`);
    await global.loading(m, conn);
    try {
        const url = global.API('theresav', '/ai/pollinations', { q: text }, 'apikey');
        const { data } = await axios.get(url);
        if (!data.status) return m.reply('Maaf, gagal membuat gambar.');
        const imageUrl = data.result || data.url;
        if (!imageUrl) return m.reply('Maaf, tidak ada gambar yang ditemukan.');
        await conn.sendMessage(m.chat, { 
            image: { url: imageUrl }, 
            caption: `*Prompt:* ${text}\n*Model:* POLLINATIONS`
        }, { quoted: m });
    } catch (e) {
        console.error(`AI IMAGE ERROR (${command}):`, e?.response?.data || e.message);
        m.reply('Gagal membuat gambar AI.');
    } finally {
        global.loading(m, conn, true);
    }
};

handler.help = ['pollinations <prompt>'];
handler.command = /^pollinations$/i;
handler.tags = ['ai'];
handler.limit = true;

handler.register = true

export default handler;

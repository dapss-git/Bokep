let handler = async (m, {
    conn,
    args,
    text,
    usedPrefix,
    command
}) => {
    if (!text) {
        return m.reply(`Gunakan format: ${usedPrefix}${command} <pertanyaan>`);
    }

    try {
        global.loading(m, conn);
        const query = encodeURIComponent(text);
        const url = global.API('theresav', '/ai/muslimai', {
            query: query
        }, 'apikey');
        const res = await fetch(url);
        const data = await res.json();
        global.loading(m, conn, true);

        if (data.status) {
            m.reply(data.result);
        } else {
            m.reply('Terjadi kesalahan saat memproses permintaan.');
        }
    } catch (error) {
        global.loading(m, conn, true);
        console.error(error);
        m.reply('Maaf, terjadi kesalahan: ' + error.message);
    }
};

handler.help = ["muslimai <pertanyaan>"];
handler.tags = ["ai"];
handler.command = /^muslimai$/i;
handler.description = "Bertanya tentang ajaran Islam.";
handler.register = true;
handler.limit = true;

export default handler;
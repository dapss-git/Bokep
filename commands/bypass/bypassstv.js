let handler = async (m, {
    conn,
    args,
    text,
    usedPrefix,
    command
}) => {
    if (!text) {
        return m.reply(`Silakan masukkan URL Linkvertise.\nContoh: ${usedPrefix}${command} https://linkvertise.com/xxxx`);
    }

    try {
        global.loading(m, conn);
        const apiUrl = global.API('theresav', '/tools/bypass/linkvertise', {
            url: text
        }, 'apikey');
        const res = await fetch(apiUrl);
        const data = await res.json();

        if (data.status) {
            global.loading(m, conn, true);
            m.reply(data.result);
        } else {
            global.loading(m, conn, true);
            m.reply(`Terjadi kesalahan: ${JSON.stringify(data)}`);
        }
    } catch (error) {
        global.loading(m, conn, true);
        console.error(error);
        m.reply(`Terjadi kesalahan: ${error}`);
    }
};

handler.help = ["bypasstv <url>"];
handler.tags = ["bypass"];
handler.command = /^bypasstv$/i;
handler.description = "Bypass Linkvertise URL.";
handler.register = true;
handler.limit = true;

export default handler;
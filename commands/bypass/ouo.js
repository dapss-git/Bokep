let handler = async (m, {
    conn,
    args,
    text,
    usedPrefix,
    command
}) => {
    if (!text) {
        return m.reply(`Masukan URL ouo.io yang ingin di bypass!\nContoh: ${usedPrefix}${command} https://ouo.io/xxxxxxxx`);
    }

    try {
        global.loading(m, conn);
        const url = global.API('theresav', '/bypass/ouo', {
            url: text
        }, 'apikey');
        const res = await fetch(url);
        const data = await res.json();

        if (data.status && data.result) {
            global.loading(m, conn, true);
            if (data.result.length > 30) {
                await m.reply(`Berhasil Bypass Ouo.io\n\nInput: ${data.input}\nResult: ${data.result}`);
            } else {
                await m.reply(`Berhasil Bypass Ouo.io\n\nInput: ${data.input}\nResult: ${data.result}`);
            }
        } else {
            global.loading(m, conn, true);
            m.reply(`Terjadi kesalahan: ${data.message || 'Gagal bypass URL.'}`);
        }
    } catch (error) {
        global.loading(m, conn, true);
        console.error(error);
        m.reply(`Terjadi kesalahan saat memproses permintaan: ${error.message || error}`);
    }
};

handler.help = ["bypassouo <url>"];
handler.tags = ["bypass"];
handler.command = /^bypassouo$/i;
handler.description = "Bypass URL ouo.io";
handler.register = true;
handler.limit = true;

export default handler;
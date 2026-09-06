let handler = async (m, {
    conn,
    args,
    text,
    usedPrefix,
    command
}) => {
    if (!text) {
        return m.reply(`Usage: ${usedPrefix}${command} <question>`);
    }

    try {
        global.loading(m, conn);
        const url = global.API('theresav', '/ai/bible', {
            text: text
        }, 'apikey');
        const res = await fetch(url);
        const data = await res.json();

        if (data.status) {
            let reply = `*Question:* ${data.question}\n\n*Answer:* ${data.result.answer}\n\n*Sources:*\n`;
            data.result.sources.forEach(source => {
                reply += `- ${source.text}\n`;
            });
            global.loading(m, conn, true);
            m.reply(reply);
        } else {
            global.loading(m, conn, true);
            m.reply(`API Error: ${data.message}`);
        }
    } catch (error) {
        global.loading(m, conn, true);
        m.reply(`Error: ${error}`);
    }
};

handler.help = ["bibleai <question>"];
handler.tags = ["ai"];
handler.command = /^bibleai$/i;
handler.description = "Ask a question to Bible AI.";
handler.register = true;
handler.limit = true;

export default handler;
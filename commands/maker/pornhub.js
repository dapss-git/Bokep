let handler = async (m, {
    conn,
    args,
    text,
    usedPrefix,
    command
}) => {
    try {
        const text1 = args[0] || 'Apocalypse';
        const text2 = args[1] || 'Bot';

        const url = global.API('theresav', '/maker/pornhub', {
            text1,
            text2
        }, 'apikey');
        const res = await fetch(url);

        if (!res.ok) {
            return m.reply(`HTTP error! status: ${res.status}`);
        }

        const buffer = await res.arrayBuffer();
        const imageBuffer = Buffer.from(buffer);

        await conn.sendMessage(m.chat, {
            image: imageBuffer,
            caption: 'Pornhub Maker'
        }, {
            quoted: m
        });

    } catch (error) {
        console.error(error);
        m.reply(`An error occurred: ${error.message}`);
    }
};

handler.help = ['pornhub <text1> <text2>'];
handler.tags = ['maker'];
handler.command = /^pornhub$/i;
handler.description = 'Creates a Pornhub-style image with custom text.';
handler.register = true;

export default handler;
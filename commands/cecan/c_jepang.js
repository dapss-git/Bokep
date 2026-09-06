let handler = async (m, { conn, usedPrefix, command }) => {
    await global.loading(m, conn);
    try {
        let apiUrl = global.API("theresav", "/cecan/cecanjepang", {}, "apikey");
        
        await conn.sendMessage(m.chat, { 
            image: { url: apiUrl }, 
            caption: `✨ *CECAN JEPANG*`,
            footer: global.footer,
            buttons: [
                {
                    buttonId: `${usedPrefix}${command}`,
                    buttonText: { displayText: 'Next ⏩' },
                    type: 1
                }
            ],
            viewOnce: true
        }, { quoted: m });

    } catch (e) {
        m.reply("❌ Error: " + e.message);
    } finally {
        await global.loading(m, conn, true);
    }
};

handler.help = ["cecanjepang"];
handler.tags = ["cecan"];
handler.command = /^cecanjepang$/i;
handler.register = true;
handler.limit = true;

export default handler;

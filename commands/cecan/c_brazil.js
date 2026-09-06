let handler = async (m, { conn, usedPrefix, command }) => {
    await global.loading(m, conn);
    try {
        let apiUrl = global.API("theresav", "/cecan/cecanbrazil", {}, "apikey");
        
        await conn.sendMessage(m.chat, { 
            image: { url: apiUrl }, 
            caption: `✨ *CECAN BRAZIL*`,
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

handler.help = ["cecanbrazil"];
handler.tags = ["cecan"];
handler.command = /^cecanbrazil$/i;
handler.register = true;
handler.limit = true;

export default handler;

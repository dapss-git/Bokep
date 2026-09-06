let handler = async (m, { conn, usedPrefix, command }) => {
    await global.loading(m, conn);
    try {
        let apiUrl = global.API("theresav", "/cecan/cecanrusia", {}, "apikey");
        
        await conn.sendMessage(m.chat, { 
            image: { url: apiUrl }, 
            caption: `✨ *CECAN RUSIA*`,
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

handler.help = ["cecanrusia"];
handler.tags = ["cecan"];
handler.command = /^cecanrusia$/i;
handler.register = true;
handler.limit = true;

export default handler;

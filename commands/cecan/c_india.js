let handler = async (m, { conn, usedPrefix, command }) => {
    await global.loading(m, conn);
    try {
        let apiUrl = global.API("theresav", "/cecan/cecanindia", {}, "apikey");
        
        await conn.sendMessage(m.chat, { 
            image: { url: apiUrl }, 
            caption: `✨ *CECAN INDIA*`,
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

handler.help = ["cecanindia"];
handler.tags = ["cecan"];
handler.command = /^cecanindia$/i;
handler.register = true;
handler.limit = true;

export default handler;

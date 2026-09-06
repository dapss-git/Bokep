let handler = async (m, { conn, usedPrefix, command }) => {
    const CECAN_ENDPOINTS = [
        { name: "AMERIKA", path: "/cecan/cecanamerika" },
        { name: "BRAZIL", path: "/cecan/cecanbrazil" },
        { name: "INDIA", path: "/cecan/cecanindia" },
        { name: "ITALIA", path: "/cecan/cecanitalia" },
        { name: "JEPANG", path: "/cecan/cecanjepang" },
        { name: "KOLOMBIA", path: "/cecan/cecankolombia" },
        { name: "RUSIA", path: "/cecan/cecanrusia" },
        { name: "VENEZUELA", path: "/cecan/cecanvenzuela" }
    ];

    const random = CECAN_ENDPOINTS[Math.floor(Math.random() * CECAN_ENDPOINTS.length)];
    
    await global.loading(m, conn);
    try {
        let apiUrl = global.API("theresav", random.path, {}, "apikey");
        
        await conn.sendMessage(m.chat, { 
            image: { url: apiUrl }, 
            caption: `✨ *RANDOM CECAN: ${random.name}*`,
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

handler.help = ["cecan"];
handler.tags = ["cecan"];
handler.command = /^(cecan)$/i;
handler.register = true;
handler.limit = true;

export default handler;

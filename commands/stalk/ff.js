let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`Contoh:\n${usedPrefix + command} 659575388`);

    await global.loading(m, conn);

    try {
        let api = global.API("theresav", "/stalk/ff", { uid: text }, "apikey");
        let res = await fetch(api);
        let json = await res.json();

        if (!json?.status || !json?.result) {
            return m.reply("❌ Player tidak ditemukan atau UID salah.");
        }

        let r = json.result;

        let caption = `🎮 *FREE FIRE PLAYER STALK*\n\n`;
        caption += `👤 *Nickname:* ${r.nickname}\n`;
        caption += `🆔 *Account ID:* ${r.uid}\n`;
        caption += `🌎 *Region:* ${r.region}\n`;
        caption += `📊 *Level:* ${r.level} (${r.exp} EXP)\n`;
        caption += `❤️ *Likes:* ${r.likes}\n`;
        caption += `🏆 *BR Rank:* ${r.brRank || "N/A"} (${r.brRankingPoints || 0} Pts)\n`;
        caption += `🎖️ *CS Rank:* ${r.csRank || "N/A"} (${r.csRankingPoints || 0} Pts)\n`;
        caption += `📅 *Created At:* ${r.created}\n`;
        caption += `🕒 *Last Login:* ${r.lastLogin}\n`;
        caption += `🛡️ *Clan:* ${r.clan || r.clanId || "Tidak ada"}\n\n`;
        
        caption += `📝 *Signature:*\n${r.signature || "Tidak ada"}\n\n`;

        caption += `> ${global.footer || "Stalker FF"}`;

        await conn.sendMessage(m.chat, { text: caption }, { quoted: m });

    } catch (e) {
        console.error(e);
        m.reply(`❌ Error: ${e.message}`);
    } finally {
        await global.loading(m, conn, true);
    }
};

handler.help = ["stalkff <uid>"];
handler.tags = ["stalk"];
handler.command = /^(stalkff|ffstalk)$/i;

handler.register = true

export default handler;

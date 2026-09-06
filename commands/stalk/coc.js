let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`Contoh:\n${usedPrefix + command} 8PG0GQ9QU`);

    await global.loading(m, conn);

    try {
        let tag = text.startsWith("#") ? text.slice(1) : text;
        let api = global.API("theresav", "/stalk/coc", { id: tag }, "apikey");
        let res = await fetch(api);
        let json = await res.json();

        if (!json?.status || !json?.result) {
            return m.reply("❌ Player tidak ditemukan atau ID salah.");
        }

        let r = json.result;
        let main = r.main_stats;
        let clan = r.clan || { name: "Tidak ada" };

        let caption = `🏰 *COC PLAYER STALK*\n\n`;
        caption += `👤 *Name:* ${r.name}\n`;
        caption += `🏷️ *Tag:* ${r.tag}\n`;
        caption += `🛡️ *Clan:* ${clan.name}\n`;
        caption += `🏛️ *Town Hall:* ${main.town_hall}\n`;
        caption += `🏆 *Trophies:* ${main.trophies}\n`;
        caption += `✨ *Exp Level:* ${main.experience}\n`;
        caption += `⭐ *War Stars:* ${main.war_stars}\n\n`;
        
        if (r.units?.heroes?.length) {
            caption += `🎭 *Heroes:*\n`;
            r.units.heroes.forEach(h => {
                caption += `• ${h.name}: ${h.level}\n`;
            });
            caption += `\n`;
        }

        if (r.units?.spells?.length) {
            caption += `🧪 *Spells:*\n`;
            caption += r.units.spells.slice(0, 10).map(s => `• ${s.name}: ${s.level}`).join('\n');
            if (r.units.spells.length > 10) caption += `\n...dan ${r.units.spells.length - 10} lainnya`;
            caption += `\n\n`;
        }

        if (r.achievements?.length) {
            caption += `🏆 *Achievements Summary:*\n`;
            let completed = r.achievements.filter(a => a.progress === "100%").length;
            caption += `• Completed: ${completed} / ${r.achievements.length}\n\n`;
        }

        caption += `🏰 *Builder Base:*\n`;
        caption += `• Level: ${r.builder_base?.stats?.builder_hall_level || "0"}\n\n`;

        caption += `> ${global.footer || "Stalker COC"}`;

        await conn.sendMessage(m.chat, { text: caption }, { quoted: m });

    } catch (e) {
        console.error(e);
        m.reply(`❌ Error: ${e.message}`);
    } finally {
        await global.loading(m, conn, true);
    }
};

handler.help = ["stalkcoc <tag>"];
handler.tags = ["stalk"];
handler.command = /^(stalkcoc|cocstalk)$/i;

handler.register = true

export default handler;

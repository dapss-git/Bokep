import fs from 'fs';
import path from 'path';

let handler = async (m, { conn, text, usedPrefix, command }) => {
    try {
        const jsonPath = path.join(process.cwd(), 'json', 'doaharian.json');
        const doaharian = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

        if (!text) {
            let rows = doaharian.map(v => ({
                title: v.title,
                description: `Pilih untuk melihat isi ${v.title}`,
                id: `${usedPrefix + command} ${v.title}`
            }));

            return conn.sendMessage(m.chat, {
                text: "🤲 *DOA HARIAN*\n\nSilakan pilih doa yang ingin Anda baca di bawah ini.",
                footer: `Total ${doaharian.length} Doa`,
                buttons: [{
                    buttonId: "doa_select",
                    buttonText: { displayText: "📖 Pilih Doa" },
                    type: 4,
                    nativeFlowInfo: {
                        name: "single_select",
                        paramsJson: JSON.stringify({
                            title: "Daftar Doa",
                            sections: [{ title: "Kategori Doa", rows }]
                        })
                    }
                }],
                headerType: 1,
                viewOnce: true
            }, { quoted: m });
        }

        let r = doaharian.find(v => v.title.toLowerCase() === text.toLowerCase());
        
        if (!r) {
            // Coba cari yang mirip
            r = doaharian.find(v => v.title.toLowerCase().includes(text.toLowerCase()));
        }

        if (!r) {
            return m.reply("❌ Doa tidak ditemukan dalam database lokal.");
        }

        let caption = `🤲 *DOA HARIAN*\n\n`;
        caption += `✨ *Judul:* ${r.title}\n\n`;
        caption += `📜 *Arab:* \n${r.arabic}\n\n`;
        caption += `📜 *Latin:* \n_${r.latin}_\n\n`;
        caption += `📜 *Arti:* \n"${r.translation}"\n\n`;
        caption += `> ${global.footer}`;

        await conn.sendMessage(m.chat, { text: caption }, { quoted: m });

    } catch (e) {
        console.error(e);
        m.reply(`❌ Error: ${e.message}`);
    }
};

handler.help = ["doaharian", "doa [nama]"];
handler.tags = ["islam"];
handler.command = /^(doaharian|doa)$/i;
handler.register = true;

export default handler;

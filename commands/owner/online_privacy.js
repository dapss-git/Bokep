const handler = async (m, { conn, text, usedPrefix, command }) => {
    const options = [
        { title: 'Semua Orang (All)', description: 'Semua orang dapat melihat saat bot sedang online', id: `${usedPrefix + command} all` },
        { title: 'Sama Seperti Terakhir Dilihat (Match Last Seen)', description: 'Setelan online mengikuti setelan terakhir dilihat (Last Seen)', id: `${usedPrefix + command} match_last_seen` }
    ];

    if (!text) {
        return conn.sendMessage(m.chat, {
            text: "🌐 *Setelan Privacy Status Online*\n\nSilakan pilih siapa saja yang dapat melihat saat akun bot ini sedang online.",
            footer: "Powered by Baileys",
            buttons: [{
                buttonId: 'online_privacy_select',
                buttonText: { displayText: '🛡️ Atur Privacy' },
                type: 4,
                nativeFlowInfo: {
                    name: 'single_select',
                    paramsJson: JSON.stringify({
                        title: 'Opsi Privacy',
                        sections: [{ title: 'Status Online', rows: options }]
                    })
                }
            }],
            headerType: 1,
            viewOnce: true
        }, { quoted: m });
    }

    const value = text.toLowerCase();
    const valid = ['all', 'match_last_seen'];
    if (!valid.includes(value)) return m.reply(`Gunakan salah satu opsi: ${valid.join(', ')}`);

    try {
        await global.loading(m, conn);
        await conn.updateOnlinePrivacy(value);
        
        let label = value === 'all' ? "Semua Orang" : "Sama Seperti 'Terakhir Dilihat'";

        m.reply(`✅ Berhasil mengubah privacy status online menjadi: *${label}*`);
    } catch (e) {
        console.error(e);
        m.reply("❌ Gagal mengubah privacy status online.");
    } finally {
        await global.loading(m, conn, true);
    }
};

handler.help = ['setonlineprivacy'];
handler.tags = ['owner'];
handler.command = /^(setonlineprivacy|onlineprivacy)$/i;
handler.owner = true;

export default handler;

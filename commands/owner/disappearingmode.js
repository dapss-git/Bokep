const handler = async (m, { conn, text, usedPrefix, command }) => {
    const options = [
        { title: 'Matikan (Off)', description: 'Nonaktifkan pesan sementara otomatis', id: `${usedPrefix + command} 0` },
        { title: '24 Jam', description: 'Pesan akan hilang setelah 24 jam', id: `${usedPrefix + command} 86400` },
        { title: '7 Hari', description: 'Pesan akan hilang setelah 7 hari', id: `${usedPrefix + command} 604800` },
        { title: '90 Hari', description: 'Pesan akan hilang setelah 90 hari', id: `${usedPrefix + command} 7776000` }
    ];

    if (!text) {
        return conn.sendMessage(m.chat, {
            text: "⏲️ *Setelan Default Pesan Sementara*\n\nSilakan pilih durasi default untuk pesan sementara pada chat baru di akun bot ini.",
            footer: "Powered by Baileys",
            buttons: [{
                buttonId: 'disappearing_mode_select',
                buttonText: { displayText: '⏲️ Atur Durasi' },
                type: 4,
                nativeFlowInfo: {
                    name: 'single_select',
                    paramsJson: JSON.stringify({
                        title: 'Opsi Durasi',
                        sections: [{ title: 'Pilih Waktu', rows: options }]
                    })
                }
            }],
            headerType: 1,
            viewOnce: true
        }, { quoted: m });
    }

    const duration = parseInt(text);
    const validDurations = [0, 86400, 604800, 7776000];
    
    if (!validDurations.includes(duration)) {
        return m.reply("Durasi tidak valid! Pilih dari menu yang tersedia.");
    }

    try {
        await global.loading(m, conn);
        await conn.updateDefaultDisappearingMode(duration);
        
        let label = "Dimatikan";
        if (duration === 86400) label = "24 Jam";
        else if (duration === 604800) label = "7 Hari";
        else if (duration === 7776000) label = "90 Hari";

        m.reply(`✅ Berhasil mengubah default pesan sementara menjadi: *${label}*`);
    } catch (e) {
        console.error(e);
        m.reply("❌ Gagal mengubah setelan pesan sementara.");
    } finally {
        await global.loading(m, conn, true);
    }
};

handler.help = ['disappearingmode'];
handler.tags = ['owner'];
handler.command = /^(disappearingmode|setephemeral)$/i;
handler.owner = true;

export default handler;

const handler = async (m, { conn, text, usedPrefix, command }) => {
    const options = [
        { title: 'Semua Orang (All)', description: 'Aktifkan laporan dibaca untuk semua orang', id: `${usedPrefix + command} all` },
        { title: 'Sembunyikan (None)', description: 'Matikan laporan dibaca untuk semua orang', id: `${usedPrefix + command} none` }
    ];

    if (!text) {
        return conn.sendMessage(m.chat, {
            text: "🔵 *Setelan Privacy Centang Biru*\n\nSilakan pilih opsi di bawah untuk mengatur apakah orang lain dapat melihat laporan dibaca dari bot.",
            footer: "Powered by Baileys",
            buttons: [{
                buttonId: 'read_privacy_select',
                buttonText: { displayText: '🛡️ Atur Privacy' },
                type: 4,
                nativeFlowInfo: {
                    name: 'single_select',
                    paramsJson: JSON.stringify({
                        title: 'Opsi Privacy',
                        sections: [{ title: 'Centang Biru', rows: options }]
                    })
                }
            }],
            headerType: 1,
            viewOnce: true
        }, { quoted: m });
    }

    const value = text.toLowerCase();
    if (!['all', 'none'].includes(value)) return m.reply("Gunakan opsi 'all' atau 'none'!");

    try {
        await global.loading(m, conn);
        await conn.updateReadReceiptsPrivacy(value);
        m.reply(`✅ Berhasil mengubah privacy centang biru menjadi: *${value === 'all' ? 'Dilihat semua orang' : 'Sembunyikan (None)'}*`);
    } catch (e) {
        console.error(e);
        m.reply("❌ Gagal mengubah privacy centang biru.");
    } finally {
        await global.loading(m, conn, true);
    }
};

handler.help = ['readprivacy'];
handler.tags = ['owner'];
handler.command = /^(readprivacy|centangbiru)$/i;
handler.owner = true;

export default handler;

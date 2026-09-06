const handler = async (m, { conn, text, usedPrefix, command }) => {
    const options = [
        { title: 'Semua Orang (All)', description: 'Siapa saja bisa menambahkan bot ke grup', id: `${usedPrefix + command} all` },
        { title: 'Hanya Kontak (Contacts)', description: 'Hanya orang di kontak yang bisa menambahkan bot ke grup', id: `${usedPrefix + command} contacts` },
        { title: 'Kontak Terbatas (Blacklist)', description: 'Hanya orang tertentu yang dibatasi', id: `${usedPrefix + command} contact_blacklist` }
    ];

    if (!text) {
        return conn.sendMessage(m.chat, {
            text: "👥 *Setelan Privacy Grup*\n\nSilakan pilih siapa saja yang diizinkan untuk menambahkan nomor bot ini ke dalam grup.",
            footer: "Powered by Baileys",
            buttons: [{
                buttonId: 'group_privacy_select',
                buttonText: { displayText: '🛡️ Atur Privacy' },
                type: 4,
                nativeFlowInfo: {
                    name: 'single_select',
                    paramsJson: JSON.stringify({
                        title: 'Opsi Privacy',
                        sections: [{ title: 'Tambah Grup', rows: options }]
                    })
                }
            }],
            headerType: 1,
            viewOnce: true
        }, { quoted: m });
    }

    const value = text.toLowerCase();
    const valid = ['all', 'contacts', 'contact_blacklist'];
    if (!valid.includes(value)) return m.reply(`Gunakan salah satu opsi: ${valid.join(', ')}`);

    try {
        await global.loading(m, conn);
        await conn.updateGroupsAddPrivacy(value);
        m.reply(`✅ Berhasil mengubah privacy grup menjadi: *${value}*`);
    } catch (e) {
        console.error(e);
        m.reply("❌ Gagal mengubah privacy grup.");
    } finally {
        await global.loading(m, conn, true);
    }
};

handler.help = ['groupprivacy'];
handler.tags = ['owner'];
handler.command = /^(groupprivacy|setgroupprivacy)$/i;
handler.owner = true;

export default handler;

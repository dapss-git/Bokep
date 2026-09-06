const handler = async (m, { conn, text, usedPrefix, command }) => {
    const options = [
        { title: 'Semua Orang (All)', description: 'Semua orang dapat melihat foto profil bot', id: `${usedPrefix + command} all` },
        { title: 'Hanya Kontak (Contacts)', description: 'Hanya orang di kontak yang dapat melihat foto profil', id: `${usedPrefix + command} contacts` },
        { title: 'Kontak Terbatas (Blacklist)', description: 'Gunakan setelan daftar blokir kontak WhatsApp', id: `${usedPrefix + command} contact_blacklist` },
        { title: 'Tidak Ada (None)', description: 'Tidak ada yang dapat melihat foto profil bot', id: `${usedPrefix + command} none` }
    ];

    if (!text) {
        return conn.sendMessage(m.chat, {
            text: "🖼️ *Setelan Privacy Foto Profil*\n\nSilakan pilih siapa saja yang diizinkan untuk melihat foto profil akun bot ini.",
            footer: "Powered by Baileys",
            buttons: [{
                buttonId: 'pp_privacy_select',
                buttonText: { displayText: '🛡️ Atur Privacy' },
                type: 4,
                nativeFlowInfo: {
                    name: 'single_select',
                    paramsJson: JSON.stringify({
                        title: 'Opsi Privacy',
                        sections: [{ title: 'Lihat Foto Profil', rows: options }]
                    })
                }
            }],
            headerType: 1,
            viewOnce: true
        }, { quoted: m });
    }

    const value = text.toLowerCase();
    const valid = ['all', 'contacts', 'contact_blacklist', 'none'];
    if (!valid.includes(value)) return m.reply(`Gunakan salah satu opsi: ${valid.join(', ')}`);

    try {
        await global.loading(m, conn);
        await conn.updateProfilePicturePrivacy(value);
        
        let label = value;
        if (value === 'all') label = "Semua Orang";
        else if (value === 'contacts') label = "Hanya Kontak";
        else if (value === 'contact_blacklist') label = "Kontak Terbatas";
        else if (value === 'none') label = "Tidak Ada";

        m.reply(`✅ Berhasil mengubah privacy foto profil menjadi: *${label}*`);
    } catch (e) {
        console.error(e);
        m.reply("❌ Gagal mengubah privacy foto profil.");
    } finally {
        await global.loading(m, conn, true);
    }
};

handler.help = ['setppprivacy'];
handler.tags = ['owner'];
handler.command = /^(setppprivacy|ppp)$/i;
handler.owner = true;

export default handler;

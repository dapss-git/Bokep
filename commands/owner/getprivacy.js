const handler = async (m, { conn }) => {
    try {
        await global.loading(m, conn);
        const privacySettings = await conn.fetchPrivacySettings(true);
        
        if (!privacySettings) {
            return m.reply("❌ Gagal mengambil data pengaturan privasi.");
        }

        let txt = `🛡️ *PENGATURAN PRIVASI SAAT INI*\n\n`;
        
        const formatValue = (val) => {
            if (val === 'all') return 'Semua Orang';
            if (val === 'contacts') return 'Hanya Kontak';
            if (val === 'contact_blacklist') return 'Kontak Terbatas (Blacklist)';
            if (val === 'none') return 'Tidak Ada / Sembunyikan';
            if (val === 'match_last_seen') return 'Sama Seperti Terakhir Dilihat';
            if (val === 'known') return 'Hanya yang Dikenal';
            return val;
        };

        txt += `• *Terakhir Dilihat:* ${formatValue(privacySettings.last)}\n`;
        txt += `• *Foto Profil:* ${formatValue(privacySettings.profile)}\n`;
        txt += `• *Status (Story):* ${formatValue(privacySettings.status)}\n`;
        txt += `• *Laporan Dibaca:* ${formatValue(privacySettings.readreceipts)}\n`;
        txt += `• *Tambah Grup:* ${formatValue(privacySettings.groupadd)}\n`;
        txt += `• *Status Online:* ${formatValue(privacySettings.online)}\n`;
        
        if (privacySettings.calladd) {
            txt += `• *Panggilan:* ${formatValue(privacySettings.calladd)}\n`;
        }

        m.reply(txt);

    } catch (e) {
        console.error(e);
        m.reply(`❌ Terjadi kesalahan: ${e.message}`);
    } finally {
        await global.loading(m, conn, true);
    }
};

handler.help = ['getprivacy'];
handler.tags = ['owner'];
handler.command = /^(getprivacy|myprivacy|cekprivacy)$/i;
handler.owner = true;

export default handler;

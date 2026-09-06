const handler = async (m, {
    db,
    text
}) => {
    try {
        if (!text) return m.reply("❌ Format: .changeage <umur>");

        const age = parseInt(text);
        if (isNaN(age)) return m.reply("❌ Umur harus berupa angka.");

        const jid = m.sender;

        let user = db.data?.users?.[jid] || {};

        if (!user.historyAge) user.historyAge = [];

        const oldAge = user.age ?? "belum diatur";

        user.age = age;

        user.historyAge.push({
            from: oldAge,
            to: age,
            at: Date.now(),
        });

        if (!db.data) db.data = {};
        if (!db.data.users) db.data.users = {};
        db.data.users[jid] = user;
        db.save();

        m.reply(`✅ Umur berhasil diubah: ${oldAge} → ${age}`);
    } catch (err) {
        console.error("ChangeAge Error:", err);
        m.reply(`❌ Terjadi kesalahan:\n${err.message}`);
    }
};

handler.help = ["changeage <umur>"];
handler.tags = ["main"];
handler.command = ["changeage", "setage"];
handler.limit = false;
handler.premium = false;
handler.register = true;

export default handler;
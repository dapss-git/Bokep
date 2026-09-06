const handler = async (m, {
    conn,
    db
}) => {

    const list = db.data || {};
    const dbOwners = (list.owner || []).map(o => typeof o === 'string' ? (o.includes('@') ? o : `${o}@s.whatsapp.net`) : (`${o[0]}@s.whatsapp.net`));

    const globalOwners = (global.owner || [])
        .filter(o => Array.isArray(o) ? o[2] !== false : true)
        .map(o => {
            const num = Array.isArray(o) ? o[0] : o;
            return String(num).replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        });

    // Gabungkan dan hilangkan duplikat
    const allOwners = [...new Set([...globalOwners, ...dbOwners])].filter(Boolean);

    if (allOwners.length === 0) {
        return m.reply("❌ Tidak ada Owner yang terdaftar di sistem.");
    }

    // Buat daftar teks
    let caption = `👑 *Daftar Owner Bot*\n\n`;
    caption += allOwners
        .map((jid, i) => {
            const num = jid.split('@')[0];
            const foundGlobal = global.owner?.find(o => (Array.isArray(o) ? o[0] : o) === num);
            const name = (Array.isArray(foundGlobal) ? foundGlobal[1] : null) || db.data?.users?.[jid]?.name || 'Owner';
            return `*${i + 1}.* @${num} (${name})`;
        })
        .join("\n");

    caption += `\n\nTotal: *${allOwners.length} Owner*`;

    await conn.sendMessage(m.chat, {
        text: caption,
        mentions: allOwners,
    }, {
        quoted: m
    });
};

handler.command = ["listowner", "listown"];
handler.tags = ["owner"];
handler.description = "Menampilkan daftar semua Owner bot.";
handler.owner = true;
handler.register = true;

export default handler;
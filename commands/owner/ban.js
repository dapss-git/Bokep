let handler = async (m, {
    conn,
    args
}) => {
    const groups = Object.values(await conn.groupFetchAllParticipating());

    let chatId = m.chat;

    if (args[0]) {
        let index = parseInt(args[0]) - 1;

        if (isNaN(index) || !groups[index]) {
            return m.reply("❌ Nomor grup tidak valid.");
        }

        chatId = groups[index].id;
    }

    if (!global.db.data.chats[chatId]) {
        global.db.data.chats[chatId] = {};
    }

    const chat = global.db.data.chats[chatId];
    chat.banchat = true;

    global.db.save();

    await m.reply(`✅ Mode banchat AKTIF untuk:\n${chatId}`);
};

handler.command = ["banchat", "ban"];
handler.tags = ["owner"];
handler.description = "Mengaktifkan mode banchat (bisa pilih grup).";
handler.owner = true;
handler.register = true;

export default handler;
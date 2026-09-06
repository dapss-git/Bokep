let handler = async (m, {
    conn,
    args,
    db
}) => {
    const groups = Object.values(await conn.groupFetchAllParticipating())

    let chatId = m.chat

    if (args[0]) {
        if (args[0].endsWith('@g.us')) {
            chatId = args[0]
        } else {
            let index = parseInt(args[0]) - 1

            if (isNaN(index) || !groups[index]) {
                return m.reply("❌ Nomor grup tidak valid.")
            }

            chatId = groups[index].id
        }
    }

    if (!db.data.chats[chatId]) {
        db.data.chats[chatId] = {}
    }

    const chat = db.data.chats[chatId]

    chat.banchat = false

    if (db.save) await db.save()

    await m.reply(`✅ Mode banchat telah NONAKTIF untuk:\n${chatId}`)
}

handler.command = ["unbanchat", "unban"]
handler.tags = ["owner"]
handler.description = "Menonaktifkan mode banchat"
handler.owner = true
handler.register = true

export default handler
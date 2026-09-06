let handler = async (m, {
    conn,
    isOwner,
    args
}) => {
    if (!m || !m.sender) return

    if (!isOwner) {
        return m.reply("⚠️ Hanya owner yang bisa menggunakan perintah ini!")
    }

    const groups = Object.values(await conn.groupFetchAllParticipating())

    let groupId = m.chat

    if (args[0]) {
        if (args[0].endsWith('@g.us')) {
            groupId = args[0]
        } else {
            let index = parseInt(args[0]) - 1

            if (isNaN(index) || !groups[index]) {
                await m.react('❌')
                return m.reply("❌ Nomor grup tidak valid.")
            }

            groupId = groups[index].id
        }
    }

    if (!groupId.endsWith('@g.us')) {
        await m.react('❌')
        return m.reply("❌ Invalid group ID.")
    }

    try {
        await m.reply(`🚪 Bot sedang keluar dari grup:\n${groupId}`)

        await conn.groupLeave(groupId)

        await m.react('✅')
        return m.reply("✅ Berhasil keluar dari grup!")
    } catch (err) {
        console.error(err)

        await m.react('❌')
        return m.reply(`❌ Gagal keluar dari grup:\n${err.message}`)
    }
}

handler.help = ['leavegc [nomor/id grup]']
handler.tags = ['owner']
handler.command = ['leavegc']
handler.owner = true
handler.register = true

export default handler
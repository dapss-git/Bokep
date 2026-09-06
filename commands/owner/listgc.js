const handler = async (m, {
    conn
}) => {
    try {
        const chats = global.db.data.chats || {}
        const groups = Object.values(await conn.groupFetchAllParticipating())

        const makeLine = () => "╰─❁"

        if (!groups || groups.length === 0) {
            return m.reply(
                `╭─❁ LIST GRUP ❁\nBot tidak berada di dalam grup manapun saat ini.\n${makeLine()}`
            )
        }

        let txt = `╭─❁ LIST GRUP ❁\nBot tergabung dalam ${groups.length} grup.\n\n`

        groups.forEach((group, i) => {
            const participants = group.participants || []
            const chat = chats[group.id] || {}

            txt += `${i + 1}. ${group.subject}\n`
            txt += `   - ID: ${group.id}\n`
            txt += `   - Anggota: ${participants.length}\n`
            txt += `   - Status: ${chat.banchat ? '❌ Banned' : '✅ Active'}\n\n`
        })

        txt += makeLine()

        m.reply(txt.trim())
    } catch (e) {
        console.error(e)

        m.reply(
            `╭─❁ LIST GRUP ❁\nGagal mengambil daftar grup. Silakan coba lagi nanti.\n${makeLine()}`
        )
    }
}

handler.help = ['listgrup', 'grouplist', 'listgc']
handler.tags = ['owner']
handler.command = /^(list(gro?up|grup|gc)|gro?uplist|gclist)$/i
handler.owner = true
handler.register = true

export default handler
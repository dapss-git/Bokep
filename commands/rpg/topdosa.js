let handler = async (m, {
    conn
}) => {
    let users = Object.entries(global.db.data.users)
        .filter(([_, user]) => user.dosa && user.dosa > 0)
        .map(([id, user]) => ({
            id,
            name: user.name,
            dosa: user.dosa
        }))

    if (users.length === 0) {
        return m.reply('😇 Belum ada yang berdosa...')
    }

    users.sort((a, b) => b.dosa - a.dosa) // Urut dari terbesar
    let top = users.slice(0, 10)
    let leaderboard = top.map((user, i) => {
        let nama = user.name || user.id.split('@')[0]
        return `${i + 1}. *${nama}* - ${user.dosa} dosa`
    })

    let teks = `
🏆 *LEADERBOARD DOSA TERBESAR*
${leaderboard.join('\n')}
`.trim()

    m.reply(teks, false, { mentions: top.map(u => u.id) })
}
handler.help = ['topdosa']
handler.tags = ['rpg', 'info']
handler.command = /^topdosa$/i
handler.register = true

export default handler
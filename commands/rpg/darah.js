let handler = async (m, {
    conn
}) => {
    let user = global.db.data.users[m.sender]

    let health = user.health ?? 0

    let nuy = `Darah kamu ${health}🩸`
    m.reply(nuy)
}

handler.tags = ['rpg']
handler.help = ['darah']
handler.command = /^(darah)$/i
handler.rpg = true

handler.register = true

export default handler
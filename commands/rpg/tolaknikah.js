let handler = async (m, {
    conn
}) => {
    let user = global.db.data.users

    if (!user[m.sender]) {
        return m.reply("Kamu belum terdaftar di database")
    }

    let calon = user[m.sender].ajaknikah

    if (!calon) {
        return m.reply("Tidak ada yang mengajakmu menikah kak")
    }

    user[m.sender].ajaknikah = ""
    if (user[calon]) user[calon].ajaknikah = ""

    await m.reply(
        `Yah... @${m.sender.split("@")[0]} menolak ajakan nikah dari @${calon.split("@")[0]} 💔`,
        false, {
            mentions: [m.sender, calon]
        }
    )
}

handler.help = ["tolaknikah"]
handler.tags = ["rpg"]
handler.command = /^(tolaknikah)$/i

handler.register = true

export default handler
let handler = async (m, {
    conn
}) => {
    let user = global.db.data.users

    if (!user[m.sender]) {
        return m.reply("Kamu belum terdaftar di database")
    }

    let pengajak = user[m.sender].ajakTinggal

    if (!pengajak) {
        return m.reply("Tidak ada yang mengajakmu tinggal bareng kak")
    }

    user[m.sender].ajakTinggal = ""
    user[m.sender].rumahTinggal = ""

    await m.reply(
        `Yah... @${m.sender.split("@")[0]} menolak ajakan tinggal bareng dari @${pengajak.split("@")[0]} 🏠❌`,
        false, {
            mentions: [m.sender, pengajak]
        }
    )
}

handler.help = ["tolaktinggal"]
handler.tags = ["rpg"]
handler.command = /^(tolaktinggal)$/i

handler.register = true

export default handler
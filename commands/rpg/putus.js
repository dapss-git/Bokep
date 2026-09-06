let handler = async (m) => {
    let user = global.db.data.users

    if (!user[m.sender]) {
        return m.reply("Kamu belum terdaftar di database")
    }

    let pacar = user[m.sender].pacar

    if (!pacar) {
        return m.reply("Kamu tidak memiliki pacar")
    }

    if (!user[pacar]) {
        return m.reply("Data pacar tidak ditemukan")
    }

    if (user[pacar].pacar !== m.sender) {
        return m.reply("Relasi tidak valid / sudah putus sebelumnya")
    }

    user[m.sender].pacar = ""
    user[pacar].pacar = ""

    user[m.sender].pacaranTime = 0
    user[pacar].pacaranTime = 0

    user[m.sender].tinggalBareng = ""
    user[m.sender].rumahTinggal = ""
    user[pacar].tinggalBareng = ""
    user[pacar].rumahTinggal = ""

    await m.reply(
        `Kamu telah putus dengan @${pacar.split("@")[0]} 💔`,
        false, {
            mentions: [pacar]
        }
    )
}

handler.help = ["putus"]
handler.tags = ["rpg"]
handler.command = /^(putus)$/i
handler.group = true

handler.register = true

export default handler
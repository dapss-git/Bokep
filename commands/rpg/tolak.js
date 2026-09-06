let handler = async (m) => {
    let user = global.db.data.users

    if (!user[m.sender]) {
        return m.reply("Kamu belum terdaftar di database")
    }

    let pacar = user[m.sender].tembak

    if (!pacar) {
        return m.reply("Tidak ada yang nembak kamu kak :)")
    }

    if (!user[pacar]) {
        return m.reply("User penembak tidak ditemukan")
    }

    if (!user[m.sender].ditembak) {
        return m.reply("Permintaan tidak valid")
    }

    if (user[pacar].tembak !== m.sender) {
        return m.reply("Permintaan sudah tidak valid / kadaluarsa")
    }

    user[m.sender].tembak = ""
    user[pacar].tembak = ""

    user[m.sender].ditembak = false
    user[pacar].ditembak = false

    await m.reply(
        `Kamu telah menolak @${pacar.split("@")[0]} 💔`,
        false, {
            mentions: [pacar]
        }
    )
}

handler.help = ["tolak"]
handler.tags = ["rpg"]
handler.command = /^(tolak)$/i

handler.register = true

export default handler
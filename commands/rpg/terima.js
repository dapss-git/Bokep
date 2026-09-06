let handler = async (m, {
    conn
}) => {
    let user = global.db.data.users

    if (!user[m.sender]) {
        return m.reply("Kamu belum terdaftar di database")
    }

    let pacar = user[m.sender].tembak

    if (!pacar) {
        return m.reply("Tidak ada yang nembak kamu kak :)")
    }

    if (!user[pacar]) {
        return m.reply("User penembak tidak ditemukan di database")
    }

    if (user[m.sender].pacar) {
        return m.reply("Kamu kan sudah punya pacar kak")
    }

    if (!user[m.sender].ditembak) {
        return m.reply("Kamu tidak sedang ditembak siapa pun")
    }

    if (user[pacar].tembak !== m.sender) {
        return m.reply("Permintaan tidak valid / sudah kadaluarsa")
    }

    user[m.sender].pacar = pacar
    user[pacar].pacar = m.sender

    user[m.sender].tembak = ""
    user[pacar].tembak = ""

    user[m.sender].ditembak = false
    user[pacar].ditembak = false

    const now = Date.now()
    user[m.sender].pacaranTime = now
    user[pacar].pacaranTime = now

    await m.reply(
        `Kamu berhasil menerima @${pacar.split("@")[0]} menjadi pacar kamu 💖\n\nGunakan command *#pacar* untuk mengecek`,
        false, {
            mentions: [pacar]
        }
    )
}

handler.help = ["terima"]
handler.tags = ["rpg"]
handler.command = /^(terima)$/i

handler.register = true

export default handler
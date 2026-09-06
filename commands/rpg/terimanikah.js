let handler = async (m, {
    conn
}) => {
    let user = global.db.data.users

    if (!user[m.sender]) {
        return m.reply("Kamu belum terdaftar di database")
    }

    let calon = user[m.sender].ajaknikah

    if (!calon) {
        return m.reply("Tidak ada yang mengajakmu menikah kak :)")
    }

    if (!user[calon]) {
        return m.reply("User yang mengajak tidak ditemukan di database")
    }

    if (user[m.sender].nikah) {
        return m.reply("Kamu kan sudah menikah kak")
    }

    if (user[calon].ajaknikah !== m.sender) {
        return m.reply("Permintaan tidak valid / sudah kadaluarsa")
    }

    user[m.sender].nikah = calon
    user[calon].nikah = m.sender

    user[m.sender].ajaknikah = ""
    user[calon].ajaknikah = ""

    const now = Date.now()
    user[m.sender].nikahTime = now
    user[calon].nikahTime = now

    await m.reply(
        `🎉 Selamat! @${m.sender.split("@")[0]} dan @${calon.split("@")[0]} sekarang telah resmi menikah! 💍💖\n\nSemoga hubungan kalian abadi selamanya!`,
        false, {
            mentions: [m.sender, calon]
        }
    )
}

handler.help = ["terimanikah"]
handler.tags = ["rpg"]
handler.command = /^(terimanikah)$/i

handler.register = true

export default handler
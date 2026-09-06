let handler = async (m, {
    conn
}) => {
    let user = global.db.data.users

    if (!user[m.sender]) {
        return m.reply("Kamu belum terdaftar di database")
    }

    let pengajak = user[m.sender].ajakTinggal
    let houseId = user[m.sender].rumahTinggal

    if (!pengajak) {
        return m.reply("Tidak ada yang mengajakmu tinggal bareng kak :)")
    }

    if (!user[pengajak]) {
        return m.reply("User yang mengajak tidak ditemukan di database")
    }

    // Pastikan pengajak masih punya rumahnya
    if (!user[pengajak].rumah || !user[pengajak].rumah[houseId]) {
        user[m.sender].ajakTinggal = ""
        user[m.sender].rumahTinggal = ""
        return m.reply("Maaf, rumah yang dimaksud sudah tidak ada (mungkin sudah dijual).")
    }

    user[m.sender].tinggalBareng = pengajak
    user[m.sender].rumahTinggal = houseId
    user[pengajak].tinggalBareng = m.sender
    user[pengajak].rumahTinggal = houseId

    user[m.sender].ajakTinggal = ""

    await m.reply(
        `🏠 Selamat! @${m.sender.split("@")[0]} sekarang resmi tinggal bareng dengan @${pengajak.split("@")[0]}! 🎉`,
        false, {
            mentions: [m.sender, pengajak]
        }
    )
}

handler.help = ["terimatinggal"]
handler.tags = ["rpg"]
handler.command = /^(terimatinggal)$/i

handler.register = true

export default handler
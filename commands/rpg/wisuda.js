let handler = async (m, { conn }) => {
    let user = global.db.data.users[m.sender]
    if (!user.education || user.education.status === "Tidak Sekolah") {
        return m.reply("Kamu belum sekolah!")
    }

    if (user.education.status === "Lulus") return m.reply("Kamu sudah lulus!")

    if (user.education.level < 50) {
        return m.reply(`Level pendidikanmu belum cukup untuk wisuda! (Minimal level 50, saat ini: ${user.education.level})`)
    }

    user.education.status = "Lulus"
    user.money += 1000000 // Hadiah kelulusan

    await m.reply(`🎓 *HAPPY GRADUATION!* 🎓\n\nSelamat @${m.sender.split("@")[0]}, kamu telah resmi lulus dan menyelesaikan pendidikanmu!\n\nHadiah Kelulusan: Rp 1.000.000\nBonus: Gaji bekerja kamu sekarang akan meningkat!`, false, { mentions: [m.sender] })
}

handler.help = ["wisuda"]
handler.tags = ["rpg"]
handler.command = /^(wisuda)$/i
handler.register = true

export default handler
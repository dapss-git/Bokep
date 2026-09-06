let handler = async (m, { conn }) => {
    let user = global.db.data.users[m.sender]
    if (!user.education || user.education.status === "Tidak Sekolah") {
        return m.reply("Kamu harus disekolahkan orang tuamu dulu!")
    }

    if (user.education.status === "Lulus") return m.reply("Kamu sudah lulus, tidak perlu belajar lagi!")

    if (new Date() - (user.education.lastStudy || 0) < 3600000) {
        let remaining = 3600000 - (new Date() - user.education.lastStudy)
        return m.reply(`Kamu baru saja belajar. Tunggu ${Math.floor(remaining / 60000)} menit lagi agar tidak pusing.`)
    }

    user.education.level = (user.education.level || 0) + 1
    user.education.lastStudy = Date.now()
    user.exp += 500

    let text = `📖 Kamu sedang belajar dengan giat...\nLevel Pendidikan: ${user.education.level}`
    if (user.education.level >= 10 && user.education.status !== "Pintar") {
        user.education.status = "Pintar"
        text += `\n\n✨ Selamat! Kamu sekarang menyandang status *Pintar*!`
    }

    await m.reply(text)
}

handler.help = ["belajar"]
handler.tags = ["rpg"]
handler.command = /^(belajar)$/i
handler.register = true

export default handler
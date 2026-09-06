let handler = async (m, { conn, text, args }) => {
    let user = global.db.data.users[m.sender]
    if (!user) return m.reply("Belum terdaftar")

    let who =
        m.mentionedJid?.[0] ||
        m.quoted?.sender ||
        (text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null)

    if (!who || who === '@s.whatsapp.net') return m.reply("Tag atau reply anak yang ingin disekolahkan!")

    if (!user.children || !user.children.includes(who)) {
        return m.reply("Dia bukan anakmu!")
    }

    let child = global.db.data.users[who]
    if (!child.education) child.education = { status: "Tidak Sekolah", level: 0 }
    
    if (child.education.status === "Sekolah") return m.reply("Anakmu sudah sekolah!")
    if (child.education.status === "Lulus") return m.reply("Anakmu sudah lulus sekolah!")

    let cost = 500000 // Biaya sekolah
    if (user.money < cost) return m.reply(`Uangmu tidak cukup! Biaya sekolah adalah Rp ${cost.toLocaleString()}`)

    user.money -= cost
    child.education.status = "Sekolah"
    child.education.level = 1
    child.education.lastStudy = Date.now()

    await m.reply(`🎓 Berhasil menyekolahkan @${who.split("@")[0]}! Sekarang dia menyandang status *Sekolah*.\nBiaya: Rp ${cost.toLocaleString()}`, false, { mentions: [who] })
}

handler.help = ["sekolahkan"]
handler.tags = ["rpg"]
handler.command = /^(sekolahkan)$/i
handler.register = true

export default handler
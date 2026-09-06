let handler = async (m, { conn, text, usedPrefix }) => {
    let user = global.db.data.users[m.sender]
    let houseId = user.rumahTinggal
    if (!houseId) return m.reply("Kamu harus berada di rumah untuk makan bareng keluarga!")

    if (!user.luxuryFood || Object.keys(user.luxuryFood).length === 0) {
        return m.reply(`Kamu tidak punya masakan mewah untuk dimakan bareng! Masak dulu dengan *${usedPrefix}masak*.`)
    }

    let foodId = Object.keys(user.luxuryFood)[0] // Ambil makanan pertama yang ada
    let partner = user.nikah || user.pacar
    let children = user.children || []
    let family = [m.sender, partner, ...children].filter(Boolean)

    user.luxuryFood[foodId] -= 1
    if (user.luxuryFood[foodId] <= 0) delete user.luxuryFood[foodId]

    family.forEach(fid => {
        if (global.db.data.users[fid]) {
            global.db.data.users[fid].energy = 100
            global.db.data.users[fid].happiness = Math.min(100, (global.db.data.users[fid].happiness || 0) + 10)
        }
    })

    await m.reply(
        `🍽️ *MAKAN BARENG KELUARGA* 🍽️\n\nKalian menikmati hidangan lezat bersama-sama!\n\n✨ Semua anggota keluarga mendapatkan pemulihan *Energi 100%* dan peningkatan kebahagiaan!`,
        false, { mentions: family }
    )
}

handler.help = ["makanbareng"]
handler.tags = ["rpg"]
handler.command = /^(makanbareng)$/i
handler.group = true
handler.register = true

export default handler
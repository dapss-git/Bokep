let handler = async (m, { conn }) => {
    let user = global.db.data.users[m.sender]
    let houseId = user.rumahTinggal
    if (!houseId) return m.reply("Kamu tidak sedang tinggal di rumah!")

    let partner = user.nikah || user.pacar
    let owner = user.rumah[houseId] ? m.sender : (partner && global.db.data.users[partner].rumah[houseId] ? partner : null)
    
    if (!owner) return m.reply("Error: Rumah tidak ditemukan!")
    let uHouse = global.db.data.users[owner].rumah[houseId]

    if (new Date() - (uHouse.lastClean || 0) < 3600000) {
        return m.reply("Rumah masih bersih! Baru saja dibersihkan.")
    }

    uHouse.lastClean = Date.now()
    if (uHouse.kondisi === "Rusak") {
        // Memperbaiki sedikit demi sedikit atau butuh biaya?
        // Untuk sekarang, kita buat membersihkan saja.
    }

    await m.reply("🧹 Kamu telah membersihkan rumah! Kondisi rumah terjaga dengan baik.")
}

handler.help = ["urusrumah"]
handler.tags = ["rpg"]
handler.command = /^(urusrumah|bersihin)$/i
handler.register = true

export default handler
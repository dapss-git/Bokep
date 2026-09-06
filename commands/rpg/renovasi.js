let handler = async (m, { conn, args }) => {
    let user = global.db.data.users[m.sender]
    let houseId = user.rumahTinggal
    if (!houseId) return m.reply("Kamu harus tinggal di sebuah rumah untuk renovasi!")

    let partner = user.nikah || user.pacar
    let owner = user.rumah[houseId] ? m.sender : (partner && global.db.data.users[partner].rumah[houseId] ? partner : null)
    
    if (!owner) return m.reply("Kamu bukan pemilik rumah ini atau partner pemilik!")
    let uHouse = global.db.data.users[owner].rumah[houseId]
    let baseHouse = global.db.data.bots.rumah.find(r => r.id == houseId)

    let currentCap = uHouse.kapasitas || baseHouse.kapasitasOrang
    let cost = currentCap * 500000

    if (args[0] !== 'gas') {
        return m.reply(`🏗️ *RENOVASI RUMAH*\n\nKapasitas saat ini: ${currentCap} orang\nBiaya upgrade (+1 kapasitas): Rp ${cost.toLocaleString()}\n\nKetik: *#renovasi gas* untuk memulai.`)
    }

    if (user.money < cost) return m.reply("Uangmu tidak cukup!")

    user.money -= cost
    uHouse.kapasitas = currentCap + 1

    await m.reply(`🎉 Sukses merenovasi rumah! Kapasitas sekarang menjadi *${uHouse.kapasitas}* orang.`)
}

handler.help = ["renovasi"]
handler.tags = ["rpg"]
handler.command = /^(renovasi)$/i
handler.register = true

export default handler
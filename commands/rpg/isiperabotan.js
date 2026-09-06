let furniture = {
    "tv": { nama: "Televisi", harga: 500000, bonus: "Menambah EXP 5% saat bekerja" },
    "kulkas": { nama: "Kulkas", harga: 750000, bonus: "Mengurangi konsumsi energi 10%" },
    "kasur": { nama: "Kasur Empuk", harga: 1000000, bonus: "Menambah energi 2x lebih cepat" },
    "sofa": { nama: "Sofa Minimalis", harga: 300000, bonus: "Menambah Kebahagiaan +5 tiap hari" }
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
    let user = global.db.data.users[m.sender]
    let houseId = user.rumahTinggal
    if (!houseId) return m.reply("Kamu harus tinggal di sebuah rumah untuk membeli perabotan!")

    let partner = user.nikah || user.pacar
    let owner = user.rumah[houseId] ? m.sender : (partner && global.db.data.users[partner].rumah[houseId] ? partner : null)
    
    if (!owner) return m.reply("Error: Rumah tidak ditemukan!")
    let uHouse = global.db.data.users[owner].rumah[houseId]

    if (!text) {
        let list = Object.entries(furniture).map(([id, item]) => `• *${item.nama}* (${id})\n  Harga: Rp ${item.harga.toLocaleString()}\n  Efek: ${item.bonus}`).join('\n\n')
        return m.reply(`🛋️ *DAFTAR PERABOTAN*\n\n${list}\n\nKetik: *${usedPrefix + command} [id]* untuk membeli.`)
    }

    let item = furniture[text.toLowerCase()]
    if (!item) return m.reply("Perabotan tidak ditemukan!")
    if (user.money < item.harga) return m.reply("Uangmu tidak cukup!")
    
    if (!uHouse.furniture) uHouse.furniture = []
    if (uHouse.furniture.includes(item.nama)) return m.reply("Rumah ini sudah punya perabotan tersebut!")

    user.money -= item.harga
    uHouse.furniture.push(item.nama)

    await m.reply(`✅ Berhasil membeli *${item.nama}* seharga Rp ${item.harga.toLocaleString()} untuk rumahmu!`)
}

handler.help = ["isiperabotan"]
handler.tags = ["rpg"]
handler.command = /^(isiperabotan|furnish)$/i
handler.register = true

export default handler
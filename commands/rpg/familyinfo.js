let handler = async (m, { conn, db }) => {
    let user = db.data.users[m.sender]
    if (!user) return m.reply("Belum terdaftar")

    let partner = user.nikah || user.pacar
    let children = user.children || []
    let parents = user.parent || []
    let houseId = user.rumahTinggal
    let house = houseId && global.db.data.bots.rumah.find(r => r.id == houseId)

    let text = `👪 *FAMILY INFO*\n\n`
    text += `👤 *Kepala Keluarga/Pasangan:* ${partner ? '@' + partner.split('@')[0] : 'Belum ada'}\n`
    
    if (parents.length > 0) {
        text += `👴 *Orang Tua:* ${parents.map(p => '@' + p.split('@')[0]).join(', ')}\n`
    }

    text += `👶 *Anak:* ${children.length > 0 ? children.map(c => '@' + c.split('@')[0]).join(', ') : 'Belum ada'}\n`
    text += `🏠 *Rumah:* ${house ? house.nama : 'Belum tinggal bareng'}\n`
    
    if (house) {
        let uHouse = user.rumah[houseId] || (partner && db.data.users[partner].rumah[houseId])
        text += `🛋️ *Perabotan:* ${uHouse?.furniture?.length > 0 ? uHouse.furniture.join(', ') : 'Kosong'}\n`
        text += `✨ *Kapasitas:* ${uHouse?.kapasitas || house.kapasitasOrang} orang\n`
    }

    text += `\n😊 *Kebahagiaan:* ${user.happiness || 0}%`

    await m.reply(text, false, { mentions: conn.parseMention(text) })
}

handler.help = ["familyinfo"]
handler.tags = ["rpg"]
handler.command = /^(familyinfo)$/i
handler.register = true

export default handler
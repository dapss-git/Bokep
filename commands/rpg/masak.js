let recipes = {
    "sup_seafood": {
        nama: "Sup Seafood Mewah",
        ingredients: { lobster: 5, udang: 5, kepiting: 5 },
        bonus: "Pemulihan energi 100% saat makan bareng"
    },
    "salad_buah": {
        nama: "Salad Buah Kerajaan",
        ingredients: { apel: 10, anggur: 10, jeruk: 10, mangga: 10 },
        bonus: "Pemulihan energi 100% saat makan bareng"
    },
    "steak_hiu": {
        nama: "Steak Hiu Panggang",
        ingredients: { hiu: 2, jeruk: 5 },
        bonus: "Pemulihan energi 100% saat makan bareng"
    }
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
    let user = global.db.data.users[m.sender]
    if (!text) {
        let list = Object.entries(recipes).map(([id, r]) => {
            let ing = Object.entries(r.ingredients).map(([item, count]) => `${count} ${item}`).join(', ')
            return `• *${r.nama}* (${id})\n  Bahan: ${ing}`
        }).join('\n\n')
        return m.reply(`🍳 *MENU MASAKAN MEWAH*\n\n${list}\n\nKetik: *${usedPrefix + command} [id]* untuk memasak.`)
    }

    let recipe = recipes[text.toLowerCase()]
    if (!recipe) return m.reply("Resep tidak ditemukan!")

    for (let [item, count] of Object.entries(recipe.ingredients)) {
        if ((user[item] || 0) < count) return m.reply(`Bahan tidak cukup! Kamu butuh ${count} ${item}, tapi hanya punya ${user[item] || 0}.`)
    }

    // Deduct ingredients
    for (let [item, count] of Object.entries(recipe.ingredients)) {
        user[item] -= count
    }

    if (!user.luxuryFood) user.luxuryFood = {}
    user.luxuryFood[text.toLowerCase()] = (user.luxuryFood[text.toLowerCase()] || 0) + 1

    await m.reply(`🍳 Berhasil memasak *${recipe.nama}*! Simpan masakan ini untuk dimakan bareng keluarga di rumah.`)
}

handler.help = ["masak"]
handler.tags = ["rpg"]
handler.command = /^(masak)$/i
handler.register = true

export default handler
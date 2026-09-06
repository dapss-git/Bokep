let handler = async (m, {
    conn,
    usedPrefix,
    command,
    text
}) => {
    let user = global.db.data.users
    let bot = global.db.data.bots

    if (!user[m.sender]) {
        return m.reply("Kamu belum terdaftar di database")
    }

    let pasangan = user[m.sender].nikah || user[m.sender].pacar

    if (!pasangan) {
        return m.reply("Kamu harus punya pacar atau menikah dulu untuk tinggal bareng!")
    }

    if (user[m.sender].tinggalBareng) {
        return m.reply(`Kamu sudah tinggal bareng dengan @${user[m.sender].tinggalBareng.split("@")[0]}!`, false, {
            mentions: [user[m.sender].tinggalBareng]
        })
    }

    let myHouses = Object.keys(user[m.sender].rumah || {})
    if (myHouses.length === 0) {
        return m.reply("Kamu tidak punya rumah untuk ditinggali bersama! Beli rumah dulu dengan `#rumah-buy`.")
    }

    let [targetId] = (text || "").split("|")
    
    // Auto-select if only one house owned, or if targetId is invalid/missing but multiple houses owned, show menu
    if (targetId && user[m.sender].rumah[targetId]) {
        // valid house ID provided
    } else if (myHouses.length === 1) {
        targetId = myHouses[0]
    } else {
        let rows = myHouses.map(id => {
            let item = bot.rumah.find(r => r.id == id)
            return {
                title: item ? item.nama : id,
                description: `ID: ${id}`,
                id: `${usedPrefix}${command} ${id}`
            }
        })

        return await conn.sendMessage(m.chat, {
            text: targetId ? `ID rumah "${targetId}" tidak valid. Pilih rumah yang ingin ditinggali bersama:` : "Pilih rumah yang ingin ditinggali bersama:",
            footer: "Live Together System",
            buttons: [{
                buttonId: "pilih_rumah_tinggal",
                buttonText: { displayText: "Pilih Rumah" },
                type: 4,
                nativeFlowInfo: {
                    name: "single_select",
                    paramsJson: JSON.stringify({
                        title: "Daftar Rumahmu",
                        sections: [{ title: "Rumah", rows }]
                    })
                }
            }]
        }, { quoted: m })
    }

    if (user[pasangan].ajakTinggal) {
        return m.reply("Pasanganmu sedang diajak tinggal bareng oleh orang lain (atau kamu sudah mengajaknya)!")
    }

    user[pasangan].ajakTinggal = m.sender
    user[pasangan].rumahTinggal = targetId

    await m.reply(
        `🏠 @${m.sender.split("@")[0]} mengajak @${pasangan.split("@")[0]} untuk tinggal bareng di rumahnya!\n\nKetik:\n${usedPrefix}terimatinggal - Untuk menerima\n${usedPrefix}tolaktinggal - Untuk menolak`,
        false, {
            mentions: [m.sender, pasangan]
        }
    )
}

handler.help = ["tinggalbareng"]
handler.tags = ["rpg"]
handler.command = /^(tinggalbareng|tb)$/i
handler.group = true

handler.register = true

export default handler
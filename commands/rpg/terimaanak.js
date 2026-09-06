let handler = async (m, { conn }) => {
    let user = global.db.data.users
    if (!user[m.sender]) return m.reply("Kamu belum terdaftar")

    let pengajak = user[m.sender].ajakAnak
    let parents = user[m.sender].parentTemp

    if (!pengajak || !parents) return m.reply("Tidak ada yang mengajakmu menjadi anak")

    user[m.sender].parent = parents
    
    // Add to children list for parents
    parents.forEach(p => {
        if (!user[p].children) user[p].children = []
        if (!user[p].children.includes(m.sender)) user[p].children.push(m.sender)
    })

    user[m.sender].happiness = 100
    user[m.sender].ajakAnak = ""
    user[m.sender].parentTemp = null

    await m.reply(
        `🎉 Selamat! @${m.sender.split("@")[0]} sekarang resmi menjadi anak dari @${parents[0].split("@")[0]} dan @${parents[1].split("@")[0]}!`,
        false, { mentions: [m.sender, ...parents] }
    )
}

handler.help = ["terimaanak"]
handler.tags = ["rpg"]
handler.command = /^(terimaanak)$/i
handler.register = true

export default handler
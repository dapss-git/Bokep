let handler = async (m, { conn, text, usedPrefix, command }) => {
    let user = global.db.data.users
    if (!user[m.sender]) return m.reply("Kamu belum terdaftar di database")

    let who = m.mentionedJid?.[0] || m.quoted?.sender || (text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null)
    
    if (!who) return m.reply(`Tag anak yang ingin kamu buang!\nContoh: ${usedPrefix + command} @user`)
    if (!user[who]) return m.reply("Orang tersebut tidak terdaftar di database")

    // Check if the sender is actually the parent of the child
    if (!user[who].parent || !user[who].parent.includes(m.sender)) {
        return m.reply("Dia bukan anakmu!")
    }

    let partner = user[who].parent.find(p => p !== m.sender)

    // Remove child from parent's children array
    if (user[m.sender].children) {
        user[m.sender].children = user[m.sender].children.filter(child => child !== who)
    }
    
    // Remove child from partner's children array
    if (partner && user[partner] && user[partner].children) {
        user[partner].children = user[partner].children.filter(child => child !== who)
    }

    // Reset child's parent info
    user[who].parent = null
    user[who].happiness = Math.max(0, (user[who].happiness || 0) - 50) // Child gets sad

    await m.reply(
        `💔 @${m.sender.split("@")[0]} telah membuang @${who.split("@")[0]} dari keluarga.`,
        false, { mentions: [m.sender, who] }
    )
}

handler.help = ["buanganak", "buanganak @user"]
handler.tags = ["rpg"]
handler.command = /^(buanganak)$/i
handler.group = true

handler.register = true

export default handler

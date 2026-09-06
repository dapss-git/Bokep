const rewards = {
    exp: 50000,
    money: 49999,
    potion: 10,
    mythic: 3,
    legendary: 1,
    limit: 20
}

const cooldown = 2592000000

function msToTime(ms) {
    let h = Math.floor(ms / 3600000)
    let m = Math.floor(ms / 60000) % 60
    let s = Math.floor(ms / 1000) % 60
    return `${h}h ${m}m ${s}s`
}

let handler = async (m, {
    conn,
    usedPrefix
}) => {
    let user = global.db.data.users[m.sender]
    if (!user.lastmonthly) user.lastmonthly = 0
    let remaining = (user.lastmonthly + cooldown) - new Date()
    if (remaining > 0) return m.reply(`You've already claimed *monthly rewards*, please wait till cooldown finish.

⏱️ ${msToTime(remaining)}`.trim())
    let text = ''
    for (let reward of Object.keys(rewards))
        if (reward in user) {
            user[reward] += rewards[reward]
            text += `➠ ${global.rpg.emoticon(reward)} ${reward}: ${toRupiah(rewards[reward])}\n`
        }
    m.reply(`🔖 Monthly Reward Received :
${text}`.trim())
    user.lastmonthly = new Date * 1
}
handler.help = ['monthly']
handler.tags = ['rpg']
handler.command = /^(monthly)$/i
handler.register = true
handler.group = true
handler.cooldown = cooldown
handler.rpg = true
export default handler

const toRupiah = number => parseInt(number).toLocaleString().replace(/,/gi, ".")
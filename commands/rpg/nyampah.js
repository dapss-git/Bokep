const rewards = {
    exp: 500,
    money: 20999,
}

const cooldown = 2592000000

let handler = async (m, {
    conn
}) => {
    let user = global.db.data.users[m.sender]

    if (!user.lastmonthly) user.lastmonthly = 0

    if (Date.now() - user.lastmonthly < cooldown) {
        const remaining = (user.lastmonthly + cooldown) - Date.now()
        const h = Math.floor(remaining / 3600000)
        const min = Math.floor((remaining % 3600000) / 60000)
        const sec = Math.floor((remaining % 60000) / 1000)
        return m.reply(`You have already claimed this monthly claim, wait for ${h}h ${min}m ${sec}s`)
    }

    let text = ''
    for (let reward of Object.keys(rewards)) {
        if (reward in user) {
            user[reward] += rewards[reward]
            text += `+${toRupiah(rewards[reward])} ${global.rpg.emoticon(reward)}${reward}\n`
        }
    }

    conn.reply(m.chat, '––––––『 NYAMPAH 』––––––\n' + text.trim(), m)

    user.lastmonthly = Date.now()
}

handler.help = ['nyampah']
handler.tags = ['rpg']
handler.command = /^(nyampah)$/i
handler.register = true
handler.group = true
handler.rpg = true

export default handler

const toRupiah = number => parseInt(number).toLocaleString().replace(/,/gi, ".")
const cooldown = 300000

let handler = async (m, {
    conn,
    usedPrefix
}) => {
    let user = global.db.data.users[m.sender]
    let timers = cooldown - (new Date - user.lastmining)

    if (user.health < 80) return m.reply(`your health is below 80﹗\nplease heal ❤ first to mining again.`)
    if (user.pickaxe == 0) return m.reply('Mau mining ga punya pickaxe 🫪')
    if (new Date - user.lastmining <= cooldown) return m.reply(`You're already mining!!, please wait 🕐${clockString(timers)}`)

    const rewards = reward(user)
    let text = 'you\'ve been mining and lost'

    for (const lost in rewards.lost)
        if (user[lost]) {
            const total = rewards.lost[lost].getRandom()
            user[lost] -= total * 1
            if (total) text += `\n${global.rpg.emoticon(lost)}${lost}: ${toRupiah(total)}`
        }

    text += '\n\nBut you got'

    for (const rewardItem in rewards.reward)
        if (rewardItem in user) {
            const total = rewards.reward[rewardItem].getRandom()
            user[rewardItem] += total * 1
            if (total) text += `\n${global.rpg.emoticon(rewardItem)}${rewardItem}: ${toRupiah(total)}`
        }

    m.reply(text.trim())
    user.lastmining = new Date * 1
}

handler.help = ['mining']
handler.tags = ['rpg']
handler.command = /^(mining)$/i
handler.register = true
handler.group = true
handler.rpg = true

export default handler

function reward(user = {}) {
    return {
        reward: {
            exp: [800, 1000, 1200, 900, 1100],
            trash: [80, 101, 90, 110, 95],
            string: [15, 25, 20, 30, 10],
            rock: [20, 30, 25, 35, 15],
            emerald: [1, 4, 0, 0, 3],
            common: [10, 40, 82, 100, 3],
            uncommon: [34, 5, 23, 81],
            mythic: [12, 4, 0, 1, 0],
            legendary: [0, 0, 5, 1, 6, 2, 0, 0],
            iron: [0, 0, 0, 1, 0, 0],
            gold: [0, 0, 0, 0, 0, 1, 0],
            diamond: [7, 2, 5, 0, 3, 0, 1, 0],
        },
        lost: {
            health: [20, 30, 40, 35, 25],
            pickaxedurability: [5, 10, 8, 12, 10]
        }
    }
}

const toRupiah = number => parseInt(number).toLocaleString().replace(/,/gi, '.')

function clockString(ms) {
    let h = Math.floor(ms / 3600000)
    let m = Math.floor(ms / 60000) % 60
    let s = Math.floor(ms / 1000) % 60
    return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}
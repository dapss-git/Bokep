let handler = async (m, {
    conn,
    command,
    args,
    usedPrefix
}) => {
    if (args.length < 1) {
        return m.reply(`Gunakan format ${usedPrefix}${command} [jumlah]\ncontoh ${usedPrefix}${command} 10`)
    }

    let total = isNumber(args[0]) ?
        Math.min(Math.max(parseInt(args[0]), 1), Number.MAX_SAFE_INTEGER) :
        1

    let user = global.db.data.users[m.sender]
    if (user.money < total) return m.reply('Money kamu kurang untuk bermain')

    let slots = []
    for (let i = 0; i < 9; i++) {
        slots.push(pickRandom([1, 2, 3, 4, 5]))
    }

    let emojis = slots.map(v =>
        v == 1 ? '🍊' :
        v == 2 ? '🍇' :
        v == 3 ? '🍉' :
        v == 4 ? '🍌' :
        '🍍'
    )

    user.money -= total

    let WinOrLose = ''
    let Hadiah = 0

    if (slots.every(v => v === slots[0])) {
        WinOrLose = 'BIG JACKPOT 🥳🥳'
        Hadiah = total * 4
        user.money += Hadiah
    } else if (slots[3] === slots[4] && slots[4] === slots[5]) {
        WinOrLose = 'JACKPOT 🥳'
        Hadiah = total * 2
        user.money += Hadiah
    } else if (
        (slots[0] === slots[1] && slots[1] === slots[2]) ||
        (slots[6] === slots[7] && slots[7] === slots[8])
    ) {
        WinOrLose = 'DIKIT LAGI 😭'
        Hadiah = Math.floor(total * 0.5)
        user.money += Hadiah
    } else {
        WinOrLose = 'YOU LOSE'
        Hadiah = -total
    }

    m.reply(`
🎰 VIRTUAL SLOTS 🎰
${emojis[0]}|${emojis[1]}|${emojis[2]}
${emojis[3]}|${emojis[4]}|${emojis[5]} <<==
${emojis[6]}|${emojis[7]}|${emojis[8]}

${WinOrLose}
${Hadiah > 0 ? '+' : ''}${toRupiah(Hadiah)}
`)
}

handler.help = ['slot', 'jackpot']
handler.tags = ['rpg']
handler.command = /^slot|jac?kpot$/i
handler.rpg = true
handler.group = true
handler.register = true

export default handler

function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)]
}

function isNumber(number) {
    return !isNaN(parseInt(number))
}

const toRupiah = number => Number(number).toLocaleString('id-ID')
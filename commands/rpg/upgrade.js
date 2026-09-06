let price = {
    fishingrod: {
        wood: 100,
        string: 100,
        bank: 100000
    },
    pickaxe: {
        wood: 100,
        iron: 100,
        bank: 100000
    },
    sword: {
        wood: 100,
        iron: 150,
        bank: 100000
    },
    armor: {
        iron: 100,
        gold: 50,
        bank: 100000
    },
    atm: {
        emerald: 10,
        bank: 100000
    }
}

let handler = async (m, {
    conn,
    args,
    usedPrefix,
    command
}) => {
    let {
        stock
    } = global.db.data.bots
    let user = global.db.data.users[m.sender]
    let type = (args[0] || '').toLowerCase()
    let total = Math.floor(isNumber(args[1]) ? Math.min(Math.max(parseInt(args[1]), 1), Number.MAX_SAFE_INTEGER) : 1)
    let emot = v => global.rpg.emoticon(v)

    if (!price[type]) return m.reply(`
ITEM KAMU: ${user.fishingrod > 0 ? `
${emot("fishingrod")} Fishingrod ( ${user.fishingrod >= 10 ? "Max" : `Lv.${user.fishingrod}`} )` : ""} ${user.pickaxe > 0 ? `
${emot("pickaxe")} Pickaxe ( ${user.pickaxe >= 10 ? "Max" : `Lv.${user.pickaxe}`} )` : ""} ${user.sword > 0 ? `
${emot('sword')} Sword ( ${user.sword >= 10 ? "Max" : `Lv.${user.sword}`} )` : ""} ${user.armor > 0 ? `
${emot('armor')} Armor ( ${user.armor >= 10 ? "Max" : `Lv.${user.armor}`} )` : ""} ${user.atm > 0 ? `
${emot('atm')} Atm ( Lv.${toRupiah(user.atm)} )` : ""} ${user.fishingrod > 0 && user.fishingrod < 10 ? `

▧ Harga Next Upgrade Fishingrod ${emot('fishingrod')}
〉 ${toRupiah(price.fishingrod.wood * user.fishingrod)} Wood ${emot("wood")}
〉 ${toRupiah(price.fishingrod.string * user.fishingrod)} String ${emot("string")}
〉 ${toRupiah(price.fishingrod.bank * user.fishingrod)} Bank ${emot("bank")}` : ""} ${user.pickaxe > 0 && user.pickaxe < 10 ? `

▧ Harga Next Upgrade Pickaxe ${emot('pickaxe')}
〉 ${toRupiah(price.pickaxe.wood * user.pickaxe)} Wood ${emot("wood")}
〉 ${toRupiah(price.pickaxe.iron * user.pickaxe)} Iron ${emot("iron")}
〉 ${toRupiah(price.pickaxe.bank * user.pickaxe)} Bank ${emot("bank")}` : ""} ${user.sword > 0 && user.sword < 10 ? `

▧ Harga Next Upgrade Sword ${emot('sword')}
〉 ${toRupiah(price.sword.wood * user.sword)} Wood ${emot("wood")}
〉 ${toRupiah(price.sword.iron * user.sword)} Iron ${emot("iron")}
〉 ${toRupiah(price.sword.bank * user.sword)} Bank ${emot("bank")}` : ""} ${user.armor > 0 && user.armor < 10 ? `

▧ Harga Next Upgrade Armor ${emot('armor')}
〉 ${toRupiah(price.armor.iron * user.armor)} Iron ${emot("iron")}
〉 ${toRupiah(price.armor.gold * user.armor)} Gold ${emot("gold")}
〉 ${toRupiah(price.armor.bank * user.armor)} Bank ${emot("bank")}` : ""} ${user.atm > 0 ? `

▧ Harga Next Upgrade Atm ${emot('atm')}
〉 ${toRupiah(price.atm.emerald * user.atm)} Emerald ${emot("emerald")}
〉 ${toRupiah(price.atm.bank * user.atm)} Bank ${emot("bank")}` : ""}

Contoh:
${usedPrefix + command} pickaxe
`.trim())

    if (user[type] === 0) return m.reply(`Kamu belum memiliki ${type}`)
    if (user[type] >= 10 && type !== "atm") return m.reply(`Level ${type} kamu telah Max!`)

    // Hitung max level yang bisa diupgrade
    const currentLv = user[type]
    const hardMax = type === 'atm' ? currentLv + 10 : 10
    const maxUpgrade = hardMax - currentLv

    // Hitung berapa level yang bisa diupgrade dengan material yang dimiliki
    const calcAffordable = () => {
        let affordable = 0
        for (let lv = 0; lv < maxUpgrade; lv++) {
            const req = Object.keys(price[type]).reduce((acc, key) => {
                let cost = 0
                for (let l = 0; l <= lv; l++) {
                    cost += price[type][key] * (currentLv + l)
                }
                acc[key] = cost
                return acc
            }, {})
            const canAfford = Object.keys(req).every(k => user[k] >= req[k])
            if (canAfford) affordable = lv + 1
            else break
        }
        return affordable
    }
    const affordableMax = calcAffordable()

    // Jika args[1] belum ada, tampilkan button pilih level
    if (!args[1]) {
        const rows = Array.from({
            length: maxUpgrade
        }, (_, i) => {
            const lvCount = i + 1
            const req = Object.keys(price[type]).reduce((acc, key) => {
                let cost = 0
                for (let l = 0; l < lvCount; l++) {
                    cost += price[type][key] * (currentLv + l)
                }
                acc[key] = cost
                return acc
            }, {})
            const canAfford = Object.keys(req).every(k => user[k] >= req[k])
            const costDesc = Object.entries(req)
                .map(([k, v]) => `${toRupiah(v)} ${capitalize(k)}`)
                .join(', ')
            return {
                title: `${canAfford ? '✅' : '❌'} +${lvCount} Level → Lv.${currentLv + lvCount}${currentLv + lvCount >= hardMax && type !== 'atm' ? ' (Max)' : ''}`,
                description: costDesc,
                id: `${usedPrefix}${command} ${type} ${lvCount}`
            }
        })

        // Tambah opsi MAX di bagian atas kalau ada yang mampu > 1 level
        if (affordableMax > 1) {
            const reqMax = Object.keys(price[type]).reduce((acc, key) => {
                let cost = 0
                for (let l = 0; l < affordableMax; l++) {
                    cost += price[type][key] * (currentLv + l)
                }
                acc[key] = cost
                return acc
            }, {})
            const costDescMax = Object.entries(reqMax)
                .map(([k, v]) => `${toRupiah(v)} ${capitalize(k)}`)
                .join(', ')
            rows.unshift({
                title: `⚡ MAX — +${affordableMax} Level → Lv.${currentLv + affordableMax}`,
                description: `Upgrade maksimal sesuai material: ${costDescMax}`,
                id: `${usedPrefix}${command} ${type} ${affordableMax}`
            })
        }

        return conn.sendMessage(m.chat, {
            text: `⚒️ *Upgrade ${capitalize(type)}* ${emot(type)}\nLevel saat ini: *Lv.${currentLv}*\nBisa upgrade: *+${affordableMax} level* (sesuai material)\n\nPilih berapa level yang ingin diupgrade 👇`,
            footer: `${global.botname || 'Bot'} · RPG`,
            buttons: [{
                buttonId: 'upgrade_select',
                buttonText: {
                    displayText: `⚒️ Pilih Level Upgrade`
                },
                type: 4,
                nativeFlowInfo: {
                    name: 'single_select',
                    paramsJson: JSON.stringify({
                        title: `Upgrade ${capitalize(type)}`,
                        sections: [{
                            title: `Lv.${currentLv} → Lv.${currentLv + maxUpgrade}`,
                            rows
                        }]
                    })
                }
            }],
            headerType: 1,
            viewOnce: true
        }, {
            quoted: m
        })
    }

    // Proses upgrade
    if (total + user[type] > 10 && type !== "atm") return m.reply(`Maximal level ${capitalize(type)} ${emot(type)} adalah 10`)

    let required = Object.keys(price[type]).reduce((acc, key) => {
        let cost = 0
        for (let l = 0; l < total; l++) {
            cost += price[type][key] * (user[type] + l)
        }
        acc[key] = cost
        return acc
    }, {})

    let materials = Object.keys(required)
    let lackMaterials = materials.filter(material => required[material] > user[material])

    if (lackMaterials.length) return m.reply(`
Material kamu kurang!!
${lackMaterials.map(material => `${emot(material)} ${material.charAt(0).toUpperCase() + material.slice(1)} kamu kurang ${toRupiah(required[material] - user[material])}`).join('\n')}
`.trim())

    user[type] += total
    materials.forEach(material => {
        user[material] -= required[material]
        stock[material] += required[material]
    })

    if (type !== 'atm') user[`${type}durability`] = user[type] * 50
    if (type === 'atm') user.fullatm = user.atm * 1000000000

    m.reply(`Sukses mengupgrade ${capitalize(type)} ${emot(type)} ke level ${toRupiah(user[type])} dan menambah ${type === 'atm' ? 'storage' : 'durability'} sebanyak ${toRupiah(type === 'atm' ? user.fullatm : user[`${type}durability`])}
${materials.map(v => {
    return `- ${toRupiah(required[v])} ${capitalize(v)} ${emot(v)}`
}).join("\n")}
`.trim())
}

handler.help = ['upgrade']
handler.tags = ['rpg']
handler.command = /^(up(grade)?)$/i
handler.register = true
handler.group = true
handler.rpg = true
export default handler

let toRupiah = number => parseInt(number).toLocaleString().replace(/,/gi, ".")

function isNumber(value) {
    value = parseInt(value)
    return typeof value === 'number' && !isNaN(value)
}

function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.substr(1)
}
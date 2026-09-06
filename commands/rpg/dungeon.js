import axios from 'axios'
import {
    createCanvas,
    GlobalFonts
} from '@napi-rs/canvas'

const BASE = 'https://raw.githubusercontent.com/Blckrose2/font2/main/'
let _fontsLoaded = false
async function loadFonts() {
    if (_fontsLoaded) return
    await Promise.all([
        axios.get(BASE + encodeURIComponent('Roboto-Black.ttf'), {
            responseType: 'arraybuffer',
            timeout: 30000,
            headers: {
                'User-Agent': 'Canvas-Dungeon'
            }
        }).then(r => GlobalFonts.register(Buffer.from(r.data), 'RobotoBlack')),
        axios.get(BASE + encodeURIComponent('Roboto-Regular.ttf'), {
            responseType: 'arraybuffer',
            timeout: 30000,
            headers: {
                'User-Agent': 'Canvas-Dungeon'
            }
        }).then(r => GlobalFonts.register(Buffer.from(r.data), 'Roboto')),
    ])
    _fontsLoaded = true
}

const THEMES = [{
        a: '#6366f1',
        b: '#8b5cf6',
        c: '#a5b4fc',
        bg1: '#0a0716',
        bg2: '#0f0a1e',
        bg3: '#07041a'
    },
    {
        a: '#0ea5e9',
        b: '#6366f1',
        c: '#38bdf8',
        bg1: '#04111e',
        bg2: '#060d1a',
        bg3: '#020910'
    },
    {
        a: '#10b981',
        b: '#06b6d4',
        c: '#34d399',
        bg1: '#041410',
        bg2: '#061a14',
        bg3: '#030d0a'
    },
    {
        a: '#f59e0b',
        b: '#ef4444',
        c: '#fbbf24',
        bg1: '#190d04',
        bg2: '#1a1004',
        bg3: '#100802'
    },
    {
        a: '#ec4899',
        b: '#8b5cf6',
        c: '#f472b6',
        bg1: '#180412',
        bg2: '#1a0516',
        bg3: '#10030d'
    },
]

function rr(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath()
}

async function generateDungeonImage({
    players,
    rewards,
    losses
}) {
    await loadFonts()
    const W = 680,
        lineH = 22
    const rewardLines = rewards.filter(Boolean)
    const H = Math.max(260, 160 + rewardLines.length * lineH + 20)
    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext('2d')
    const T = THEMES[Math.floor(Math.random() * THEMES.length)]
    const MP = 10

    const bg = ctx.createLinearGradient(0, 0, W, H)
    bg.addColorStop(0, T.bg1);
    bg.addColorStop(0.5, T.bg2);
    bg.addColorStop(1, T.bg3)
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H)

    for (const b of [{
                x: 0,
                y: 0,
                r: 240,
                c: T.a + '18'
            },
            {
                x: W,
                y: H,
                r: 220,
                c: T.b + '12'
            },
            {
                x: W / 2,
                y: H / 2,
                r: 180,
                c: T.c + '0a'
            },
        ]) {
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r)
        g.addColorStop(0, b.c);
        g.addColorStop(1, 'transparent')
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H)
    }

    ctx.save()
    for (let i = 0; i < 60; i++) {
        ctx.globalAlpha = Math.random() * 0.5 + 0.1
        ctx.fillStyle = '#fff'
        ctx.beginPath();
        ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 1.2, 0, Math.PI * 2);
        ctx.fill()
    }
    ctx.restore()

    rr(ctx, MP, MP, W - MP * 2, H - MP * 2, 20)
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke()

    ctx.save()
    const sh = ctx.createLinearGradient(MP + 60, MP, W - MP - 60, MP)
    sh.addColorStop(0, 'transparent');
    sh.addColorStop(0.3, T.a + 'cc')
    sh.addColorStop(0.5, T.c + 'ff');
    sh.addColorStop(0.7, T.b + 'cc');
    sh.addColorStop(1, 'transparent')
    ctx.strokeStyle = sh;
    ctx.lineWidth = 2;
    ctx.shadowColor = T.c;
    ctx.shadowBlur = 8
    ctx.beginPath();
    ctx.moveTo(MP + 60, MP + 1);
    ctx.lineTo(W - MP - 60, MP + 1);
    ctx.stroke()
    ctx.restore()

    ctx.save();
    ctx.strokeStyle = T.a + '55';
    ctx.lineWidth = 2
    for (const [cx, cy, dx, dy] of [
            [MP + 10, MP + 10, 1, 1],
            [W - MP - 10, MP + 10, -1, 1],
            [MP + 10, H - MP - 10, 1, -1],
            [W - MP - 10, H - MP - 10, -1, -1],
        ]) {
        ctx.beginPath();
        ctx.moveTo(cx + dx * 14, cy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx, cy + dy * 14);
        ctx.stroke()
    }
    ctx.restore()

    let y = MP + 34
    ctx.save();
    ctx.font = 'bold 18px RobotoBlack';
    ctx.textAlign = 'center'
    const tg = ctx.createLinearGradient(W / 2 - 100, y, W / 2 + 100, y)
    tg.addColorStop(0, T.a);
    tg.addColorStop(0.5, T.c);
    tg.addColorStop(1, T.b)
    ctx.fillStyle = tg;
    ctx.shadowColor = T.c;
    ctx.shadowBlur = 10
    ctx.fillText('⚔  D U N G E O N  ⚔', W / 2, y);
    ctx.restore()
    y += 8

    const drawDiv = (col) => {
        ctx.save()
        const d = ctx.createLinearGradient(30, y, W - 30, y)
        d.addColorStop(0, 'transparent');
        d.addColorStop(0.5, col);
        d.addColorStop(1, 'transparent')
        ctx.strokeStyle = d;
        ctx.lineWidth = 1
        ctx.beginPath();
        ctx.moveTo(30, y);
        ctx.lineTo(W - 30, y);
        ctx.stroke()
        ctx.restore()
    }

    drawDiv(T.a + '88');
    y += 18

    ctx.font = '13px Roboto';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'left'
    ctx.fillText('Players:', 30, y);
    y += 18
    ctx.save();
    ctx.font = 'bold 14px RobotoBlack';
    ctx.fillStyle = T.c
    ctx.fillText(players, 30, y);
    ctx.restore();
    y += 24

    ctx.font = 'bold 12px RobotoBlack';
    ctx.fillStyle = '#ef4444'
    ctx.fillText('✦  LOSSES', 30, y);
    y += 18
    for (const line of losses) {
        ctx.font = '12px Roboto';
        ctx.fillStyle = '#fca5a5'
        ctx.fillText(line, 40, y);
        y += lineH
    }
    y += 4;
    drawDiv(T.b + '66');
    y += 14

    ctx.font = 'bold 12px RobotoBlack';
    ctx.fillStyle = T.c
    ctx.fillText('✦  REWARDS', 30, y);
    y += 18

    const col = Math.ceil(rewardLines.length / 2)
    for (let i = 0; i < rewardLines.length; i++) {
        ctx.font = '12px Roboto';
        ctx.fillStyle = '#e2e8f0'
        ctx.fillText(rewardLines[i], i < col ? 40 : W / 2 + 10, y + (i < col ? i : i - col) * lineH)
    }

    ctx.save()
    const bar = ctx.createLinearGradient(MP + 30, H - MP - 6, W - MP - 30, H - MP - 6)
    bar.addColorStop(0, 'transparent');
    bar.addColorStop(0.5, T.a + 'aa');
    bar.addColorStop(1, 'transparent')
    ctx.strokeStyle = bar;
    ctx.lineWidth = 2;
    ctx.shadowColor = T.a;
    ctx.shadowBlur = 6
    ctx.beginPath();
    ctx.moveTo(MP + 30, H - MP - 6);
    ctx.lineTo(W - MP - 30, H - MP - 6);
    ctx.stroke()
    ctx.restore()

    return canvas.toBuffer('image/png')
}

function buildRewards(price, multiplier = 1) {
    const {
        exp,
        money,
        sampah,
        potion,
        diamond,
        iron,
        kayu,
        batu,
        string,
        common,
        uncommon,
        mythic,
        legendary,
        pet,
        petfood
    } = price
    return [
        `✨ exp: ${exp * multiplier}`,
        `💰 money: ${money * multiplier}`,
        `🗑 trash: ${(sampah || 0) * multiplier}`,
        potion ? `🥤 potion: ${potion * multiplier}` : '',
        petfood ? `🍖 petfood: ${petfood * multiplier}` : '',
        kayu ? `🪵 wood: ${kayu * multiplier}` : '',
        batu ? `🪨 stone: ${batu * multiplier}` : '',
        string ? `🕸 string: ${string * multiplier}` : '',
        iron ? `⛓ iron: ${iron * multiplier}` : '',
        diamond ? `💎 diamond: ${diamond * multiplier}` : '',
        common ? `📦 common: ${common * multiplier}` : '',
        uncommon ? `🛍 uncommon: ${uncommon * multiplier}` : '',
        mythic ? `🎁 mythic: ${mythic * multiplier}` : '',
        legendary ? `🗃 legendary: ${legendary * multiplier}` : '',
        pet ? `🔖 pet token: ${pet * multiplier}` : '',
    ].filter(Boolean)
}

function applyRewards(user, price) {
    const {
        exp,
        money,
        sampah,
        potion,
        diamond,
        iron,
        kayu,
        batu,
        string,
        common,
        uncommon,
        mythic,
        legendary,
        pet,
        petfood
    } = price
    user.money += money * 1;
    user.exp += exp * 1
    user.trash += (sampah || 0) * 1;
    user.potion += potion * 1
    user.diamond += diamond * 1;
    user.iron += iron * 1
    user.wood += kayu * 1;
    user.rock += batu * 1
    user.string += string * 1;
    user.common += common * 1
    user.uncommon += uncommon * 1;
    user.mythic += mythic * 1
    user.legendary += legendary * 1;
    user.pet += pet * 1
    user.petfood += petfood * 1;
    user.lastdungeon = Date.now()
}

function checkWarnings(users, player, usedPrefix) {
    const HEALT = [],
        SDH = [],
        SDM1L = []
    for (const p of player) {
        if (!users[p]) continue
        if ((users[p].health * 1) < 1) HEALT.push(p)
        if ((users[p].sworddurability * 1) < 1 && (users[p].sword * 1) == 1) SDH.push(p)
        if ((users[p].sworddurability * 1) < 1 && (users[p].sword * 1) !== 1) SDM1L.push(p)
    }
    const warn = []
    if (SDH.length) warn.push(`⚔️ sword ${fmtPlayers(SDH)} destroyed — type *${usedPrefix}craft sword*`)
    if (SDM1L.length) warn.push(`⚔️ sword ${fmtPlayers(SDM1L)} level reduced by 1`)
    if (HEALT.length) warn.push(`❤️ health ${fmtPlayers(HEALT)} is 0 — type *${usedPrefix}heal*`)
    return warn.join('\n')
}

const handler = async (m, {
    conn,
    usedPrefix,
    command,
    text
}) => {
    conn.dungeon = conn.dungeon || {}
    const user = global.db.data.users[m.sender]

    if (user.sword < 1 || user.armor < 1 || user.health < 90)
        return conn.reply(m.chat, item(user.sword, user.armor, user.health, usedPrefix), m)

    if (Object.values(conn.dungeon).find(r =>
            r.id.startsWith('dungeon') && [r.game.player1, r.game.player2, r.game.player3, r.game.player4].includes(m.sender)
        )) return m.reply('Kamu masih di dalam Dungeon')

    const timing = Date.now() - (user.lastdungeon * 1)
    if (timing < 600000) return m.reply(`*––––––『 COOLDOWN 』––––––*\nʏᴏᴜ ʜᴀᴠᴇ ɢᴏɴᴇ ᴛᴏ ᴛʜᴇ ᴅᴜɴɢᴇᴏɴ, please wait...\n➞ ${clockString(600000 - timing)}`)

    let room = Object.values(conn.dungeon).find(r => r.state === 'WAITING' && (text ? r.name === text : true))
    if (room) {
        const p1 = room.game.player1 || '',
            p2 = room.game.player2 || '',
            p3 = room.game.player3 || '',
            p4 = room.game.player4 || ''
        const c1 = room.player1 || '',
            c2 = room.player2 || '',
            c3 = room.player3 || '',
            c4 = room.player4 || ''

        if (!p2) {
            room.player2 = m.chat;
            room.game.player2 = m.sender
        } else if (!p3) {
            room.player3 = m.chat;
            room.game.player3 = m.sender
        } else if (!p4) {
            room.player4 = m.chat;
            room.game.player4 = m.sender;
            room.state = 'PLAYING'
        }

        const waiting = !room.game.player4
        const lmao = waiting ?
            `[• • •] ᴡᴀɪᴛɪɴɢ ${!room.game.player3 ? '2' : '1'} ᴘʟᴀʏᴇʀ ᴀɢᴀɪɴ...${room.name ? `\n➞ ᴊᴏɪɴ: *${usedPrefix}${command} ${room.name}*` : ''}` :
            `ᴀʟʟ ᴘʟᴀʏᴇʀs ᴀʀᴇ ᴄᴏᴍᴘʟᴇᴛᴇ!\ntype *sendiri* to play solo or *gass* to start together`
        m.reply(`*––––––『 DUNGEON 』––––––*\n${lmao}`)

        if (room.game.player1 && room.game.player2 && room.game.player3 && room.game.player4) {
            conn.dungeon[room.id] = room
        }
    } else {
        const room = {
            id: 'dungeon-' + Date.now(),
            player1: m.chat,
            player2: '',
            player3: '',
            player4: '',
            state: 'WAITING',
            game: {
                player1: m.sender,
                player2: '',
                player3: '',
                player4: ''
            },
            price: {
                money: Math.floor(Math.random() * 1001),
                exp: Math.floor(Math.random() * 3001),
                sampah: Math.floor(Math.random() * 1001),
                potion: Math.floor(Math.random() * 5),
                diamond: pickRandom([0, 0, 0, 0, 1, 1, 1, 5, 3, 0, 0]),
                iron: Math.floor(Math.random() * 10),
                kayu: Math.floor(Math.random() * 12),
                batu: Math.floor(Math.random() * 10),
                string: Math.floor(Math.random() * 10),
                common: pickRandom([0, 0, 0, 3, 2, 4, 1, 0, 0]),
                uncommon: pickRandom([0, 0, 0, 1, 2, 1, 3, 0, 0, 0]),
                mythic: pickRandom([0, 0, 0, 1, 2, 1, 1, 0, 0, 0, 0, 0]),
                legendary: pickRandom([0, 0, 0, 2, 3, 1, 0, 0, 0, 0, 0, 0, 0]),
                pet: pickRandom([0, 0, 0, 1, 3, 5, 2, 4, 0, 0, 0, 0, 0, 0]),
                petfood: pickRandom([0, 0, 0, 1, 4, 3, 6, 0, 0, 0, 0]),
            },
            less: {
                health: Math.floor(Math.random() * 101),
                sword: Math.floor(Math.random() * 50)
            }
        }
        if (text) room.name = text
        conn.dungeon[room.id] = room
        m.reply(`*––––––『 DUNGEON 』––––––*\n[ • • • ] ᴡᴀɪᴛɪɴɢ ᴘʟᴀʏᴇʀ${text ? `\n➞ ᴊᴏɪɴ: *${usedPrefix}${command} ${text}*` : ''}\nᴏʀ ᴛʏᴘᴇ *sendiri* ᴛᴏ ᴘʟᴀʏ sᴏʟᴏ`)
    }
}

handler.before = async (m, {
    conn
}) => {
    if (!m.text || m.key.fromMe) return
    conn.dungeon = conn.dungeon || {}

    const room = Object.values(conn.dungeon).find(r =>
        r.id.startsWith('dungeon-') && [r.game.player1, r.game.player2, r.game.player3, r.game.player4].includes(m.sender) &&
        r.state === 'WAITING'
    )
    if (!room) return

    const txt = m.text.trim().toLowerCase()
    const p1 = room.game.player1 || '',
        p2 = room.game.player2 || '',
        p3 = room.game.player3 || '',
        p4 = room.game.player4 || ''
    const c1 = room.player1 || '',
        c2 = room.player2 || '',
        c3 = room.player3 || '',
        c4 = room.player4 || ''
    const PLAYER = [p1, p2, p3, p4].filter(Boolean)
    const P = fmtPlayers(PLAYER)

    const sendAll = (str) => {
        const sent = new Set()
        for (const jid of [c1, c2, c3, c4]) {
            if (!jid || sent.has(jid)) continue
            sent.add(jid)
            conn.sendMessage(jid, {
                text: str,
                mentions: conn.parseMention(str)
            }, {
                quoted: m
            })
        }
    }

    const sendImgAll = async (buf, caption) => {
        const sent = new Set()
        for (const jid of [c1, c2, c3, c4]) {
            if (!jid || sent.has(jid)) continue
            sent.add(jid)
            await conn.sendFile(jid, buf, 'dungeon.png', caption, m)
        }
    }

    if (/^(sendiri|dewean)$/i.test(txt)) {
        if (room.player2 || room.player3 || room.player4)
            return conn.reply(m.chat, "can't play solo — you already have partner(s)\ntype *gass* to start together", m)

        room.state = 'PLAYING'
        conn.reply(c1, `*room:* ${room.id}\n*player:* ${P}`, m, {
            contextInfo: {
                mentionedJid: conn.parseMention(P)
            }
        })

        setTimeout(async () => {
            const u = global.db.data.users[p1]
            const {
                health,
                sword
            } = room.less

            u.health -= health * 1;
            u.sworddurability -= sword * 1
            applyRewards(u, room.price)
            if ((u.health * 1) < 1) u.health = 0
            if ((u.sworddurability * 1) < 1) {
                u.sword -= 1;
                u.sworddurability = 0
            }

            const losses = [`❤️ health: -${health}`, `⚔️ sword durability: -${sword}`]
            const rewards = buildRewards(room.price, 1)

            const img = await generateDungeonImage({
                players: P,
                rewards,
                losses
            }).catch(() => null)
            if (img) await conn.sendFile(c1, img, 'dungeon.png', '🗡️ Dungeon Result', m)
            else conn.reply(c1, `losses:\n${losses.join('\n')}\n\nrewards:\n${rewards.join('\n')}`, m)

            const {
                mythic,
                legendary,
                pet
            } = room.price
            if (mythic > 0) conn.reply(c1, `🎉 congrats! you got *${mythic}* mythic crate`, m)
            if (legendary > 0 || pet > 0) {
                const r = legendary > 0 && pet > 0 ? `*${legendary}* legendary & *${pet}* pet token` : pet > 0 ? `*${pet}* pet token` : `*${legendary}* legendary crate`
                conn.reply(c1, `🎉 ${mythic > 0 ? 'and' : 'congrats!'} you got ${r}`, m)
            }

            const warn = checkWarnings(global.db.data.users, [p1], '.')
            if (warn) conn.reply(c1, warn, m)

            delete conn.dungeon[room.id]
        }, pickRandom([3000, 5000, 7000, 9000, 11000]))

    } else if (/^(gass*|mulai)$/i.test(txt)) {
        if (!p2) return conn.reply(m.chat, 'Belum ada player lain yang join!', m)

        room.state = 'PLAYING'
        const n = PLAYER.length

        for (const _p of PLAYER) {
            room.price.money += Math.floor(Math.random() * 41)
            room.price.exp += Math.floor(Math.random() * 76)
            room.price.string += pickRandom([0, 0, 5, 10, 3, 4, 0, 1, 0, 0, 0, 0, 0, 0])
            room.price.kayu += pickRandom([0, 0, 0, 1, 10, 4, 5, 0, 0, 0, 0, 0, 0])
            room.price.batu += pickRandom([0, 0, 0, 5, 10, 3, 4, 1, 0, 0, 0, 0, 0, 0])
            room.price.common += pickRandom([0, 0, 0, 3, 4, 6, 1, 0, 0, 0, 0, 0, 0, 0, 0])
        }

        sendAll(`*room:* ${room.id}\n*players:*\n${PLAYER.map(p => `▸ ${M(p)}`).join('\n')}\n\nDungeon dimulai!`)

        const users = global.db.data.users
        const {
            health,
            sword
        } = room.less

        for (let i = 0; i < PLAYER.length; i++) {
            const p = PLAYER[i]
            setTimeout(() => {
                if (!users[p]) return
                users[p].health -= health * 1
                users[p].sworddurability -= sword * 1
                applyRewards(users[p], room.price)
                if ((users[p].health * 1) < 1) users[p].health = 0
                if ((users[p].sworddurability * 1) < 1) {
                    users[p].sword -= 1
                    users[p].sworddurability = (users[p].sword * 1) * 50
                }
            }, i * 1500)
        }

        setTimeout(async () => {
            const losses = [`❤️ health: -${health}`, `⚔️ sword durability: -${sword}`]
            const rewards = buildRewards(room.price, n)

            const img = await generateDungeonImage({
                players: P,
                rewards,
                losses
            }).catch(() => null)
            if (img) await sendImgAll(img, '🗡️ Dungeon Result')
            else sendAll(`losses:\n${losses.join('\n')}\n\nrewards:\n${rewards.join('\n')}`)

            const {
                mythic,
                legendary,
                pet
            } = room.price
            if (mythic > 0) sendAll(`🎉 congrats ${P} — you all got *${mythic * n}* mythic crate!`)
            if (legendary > 0 || pet > 0) {
                const r = legendary > 0 && pet > 0 ? `*${legendary*n}* legendary & *${pet*n}* pet token` : pet > 0 ? `*${pet*n}* pet token` : `*${legendary*n}* legendary crate`
                sendAll(`🎉 ${mythic > 0 ? 'and' : `congrats ${P}!`} you got ${r}`)
            }

            const warn = checkWarnings(users, PLAYER, '.')
            if (warn) sendAll(warn)

            delete conn.dungeon[room.id]
        }, pickRandom([3000, 5000, 7000, 9000, 11000]))
    }
}

handler.help = ['dungeon']
handler.tags = ['rpg']
handler.command = /^(dungeon)$/i
handler.level = 15
handler.rpg = true
handler.group = true
handler.register = true;
export default handler

function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)]
}

function M(jid) {
    return '@' + jid.split('@')[0]
}

function fmtPlayers(arr) {
    return arr.map((p, i) => i === arr.length - 1 && arr.length > 1 ? `and *${M(p)}*` : `*${M(p)}*`).join(', ')
}

function item(sword, armor, health, usedPrefix) {
    const sw = sword < 1,
        a = armor < 1,
        h = health < 90
    return [
        sw ? `➞ ʏᴏᴜ ᴅᴏɴ'ᴛ ʜᴀᴠᴇ ᴀ sᴡᴏʀᴅ ʏᴇᴛ${a ? ' ᴀɴᴅ ᴀʀᴍᴏʀ !' : ''}` : '',
        h ? '➞ ʏᴏᴜʀ ʜᴇᴀʟᴛʜ ᴍᴜsᴛ ʙᴇ ᴀᴛ ʟᴇᴀsᴛ 90' : '',
        '- - - - - - - - - - - - - - -',
        sw ? `「🗡️」• ᴛʏᴘᴇ: *${usedPrefix}craft sword*` : '',
        a ? `「🥼」• ᴛʏᴘᴇ: *${usedPrefix}craft armor*` : '',
        h ? `「❤️」• ᴛʏᴘᴇ: *${usedPrefix}heal*` : '',
    ].filter(Boolean).join('\n')
}

function clockString(ms) {
    const h = Math.floor(ms / 3600000) % 24
    const min = Math.floor(ms / 60000) % 60
    const s = Math.floor(ms / 1000) % 60
    return `${h}h ${min}m ${s}s`
}
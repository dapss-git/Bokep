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
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
}

async function generateDungeonImage({
    players,
    rewards,
    losses,
    solo
}) {
    await loadFonts()

    const W = 680
    const lineH = 22
    const rewardLines = rewards.filter(Boolean)
    const H = Math.max(260, 160 + rewardLines.length * lineH + 20)
    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext('2d')
    const T = THEMES[Math.floor(Math.random() * THEMES.length)]
    const M = 10

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

    ctx.save()
    rr(ctx, M, M, W - M * 2, H - M * 2, 20)
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke()
    ctx.restore()

    ctx.save()
    const sh = ctx.createLinearGradient(M + 60, M, W - M - 60, M)
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
    ctx.moveTo(M + 60, M + 1);
    ctx.lineTo(W - M - 60, M + 1);
    ctx.stroke()
    ctx.restore()

    ctx.save();
    ctx.strokeStyle = T.a + '55';
    ctx.lineWidth = 2
    for (const [cx, cy, dx, dy] of [
            [M + 10, M + 10, 1, 1],
            [W - M - 10, M + 10, -1, 1],
            [M + 10, H - M - 10, 1, -1],
            [W - M - 10, H - M - 10, -1, -1],
        ]) {
        ctx.beginPath();
        ctx.moveTo(cx + dx * 14, cy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx, cy + dy * 14);
        ctx.stroke()
    }
    ctx.restore()

    let y = M + 34

    ctx.save()
    ctx.font = 'bold 18px RobotoBlack'
    ctx.textAlign = 'center'
    const titleGrad = ctx.createLinearGradient(W / 2 - 100, y, W / 2 + 100, y)
    titleGrad.addColorStop(0, T.a);
    titleGrad.addColorStop(0.5, T.c);
    titleGrad.addColorStop(1, T.b)
    ctx.fillStyle = titleGrad
    ctx.shadowColor = T.c;
    ctx.shadowBlur = 10
    ctx.fillText('⚔  D U N G E O N  ⚔', W / 2, y)
    ctx.restore()
    y += 8

    ctx.save()
    const div = ctx.createLinearGradient(30, y, W - 30, y)
    div.addColorStop(0, 'transparent');
    div.addColorStop(0.5, T.a + '88');
    div.addColorStop(1, 'transparent')
    ctx.strokeStyle = div;
    ctx.lineWidth = 1
    ctx.beginPath();
    ctx.moveTo(30, y);
    ctx.lineTo(W - 30, y);
    ctx.stroke()
    ctx.restore()
    y += 18

    ctx.font = '13px Roboto'
    ctx.fillStyle = '#94a3b8'
    ctx.textAlign = 'left'
    ctx.fillText('Players:', 30, y)
    y += 18
    ctx.save()
    ctx.font = 'bold 14px RobotoBlack'
    ctx.fillStyle = T.c
    ctx.fillText(players, 30, y)
    ctx.restore()
    y += 24

    ctx.save()
    ctx.font = 'bold 12px RobotoBlack';
    ctx.fillStyle = '#ef4444'
    ctx.textAlign = 'left'
    ctx.fillText('✦  LOSSES', 30, y)
    y += 18
    for (const line of losses) {
        ctx.font = '12px Roboto';
        ctx.fillStyle = '#fca5a5'
        ctx.fillText(line, 40, y);
        y += lineH
    }
    y += 4

    ctx.save()
    const div2 = ctx.createLinearGradient(30, y, W - 30, y)
    div2.addColorStop(0, 'transparent');
    div2.addColorStop(0.5, T.b + '66');
    div2.addColorStop(1, 'transparent')
    ctx.strokeStyle = div2;
    ctx.lineWidth = 1
    ctx.beginPath();
    ctx.moveTo(30, y);
    ctx.lineTo(W - 30, y);
    ctx.stroke()
    ctx.restore()
    y += 14

    ctx.font = 'bold 12px RobotoBlack';
    ctx.fillStyle = T.c
    ctx.fillText('✦  REWARDS', 30, y)
    y += 18

    const col = Math.ceil(rewardLines.length / 2)
    for (let i = 0; i < rewardLines.length; i++) {
        const xOff = i < col ? 40 : W / 2 + 10
        const yOff = y + (i < col ? i : i - col) * lineH
        ctx.font = '12px Roboto';
        ctx.fillStyle = '#e2e8f0'
        ctx.fillText(rewardLines[i], xOff, yOff)
    }
    y += col * lineH + 10

    ctx.save()
    const bar = ctx.createLinearGradient(M + 30, H - M - 6, W - M - 30, H - M - 6)
    bar.addColorStop(0, 'transparent');
    bar.addColorStop(0.5, T.a + 'aa');
    bar.addColorStop(1, 'transparent')
    ctx.strokeStyle = bar;
    ctx.lineWidth = 2;
    ctx.shadowColor = T.a;
    ctx.shadowBlur = 6
    ctx.beginPath();
    ctx.moveTo(M + 30, H - M - 6);
    ctx.lineTo(W - M - 30, H - M - 6);
    ctx.stroke()
    ctx.restore()

    return canvas.toBuffer('image/png')
}

export async function before(m, {
    conn
}) {
    conn.dungeon = conn.dungeon || {}
    let room = Object.values(conn.dungeon).find(r =>
        r.id.startsWith('dungeon-') && [r.game.player1, r.game.player2, r.game.player3, r.game.player4].includes(m.sender) &&
        r.state == 'WAITING'
    )
    if (!room) return

    const txt = (m.text || '').toLowerCase()

    let p1 = room.game.player1 || ''
    let p2 = room.game.player2 || ''
    let p3 = room.game.player3 || ''
    let p4 = room.game.player4 || ''
    let c1 = room.player1 || ''
    let c2 = room.player2 || ''
    let c3 = room.player3 || ''
    let c4 = room.player4 || ''

    let PLAYER = [p1, p2, p3, p4].filter(Boolean)
    let P = data(PLAYER)

    const sendAll = (str) => {
        let sent = new Set()
        for (let jid of [c1, c2, c3, c4]) {
            if (!jid || sent.has(jid)) continue
            sent.add(jid)
            conn.reply(jid, str, m, {
                contextInfo: {
                    mentionedJid: conn.parseMention(str)
                }
            })
        }
    }

    const sendImgAll = async (buf, caption) => {
        let sent = new Set()
        for (let jid of [c1, c2, c3, c4]) {
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
            let u = global.db.data.users[p1]
            let {
                health,
                sword
            } = room.less
            let {
                exp,
                money,
                sampah: trash,
                potion,
                diamond,
                iron,
                kayu: wood,
                batu: stone,
                string,
                common,
                uncommon,
                mythic,
                legendary,
                pet,
                petfood
            } = room.price

            u.health -= health * 1;
            u.sworddurability -= sword * 1
            u.money += money * 1;
            u.exp += exp * 1
            u.trash += trash * 1;
            u.potion += potion * 1
            u.diamond += diamond * 1;
            u.iron += iron * 1
            u.wood += wood * 1;
            u.rock += stone * 1
            u.string += string * 1;
            u.common += common * 1
            u.uncommon += uncommon * 1;
            u.mythic += mythic * 1
            u.legendary += legendary * 1;
            u.pet += pet * 1
            u.petfood += petfood * 1;
            u.lastdungeon = Date.now()

            const losses = [`❤️ health: -${health}`, `⚔️ sword durability: -${sword}`]
            const rewards = [
                `✨ exp: ${exp}`, `💰 money: ${money}`,
                `🗑 trash: ${trash}`,
                potion ? `🥤 potion: ${potion}` : '',
                petfood ? `🍖 petfood: ${petfood}` : '',
                wood ? `🪵 wood: ${wood}` : '',
                stone ? `🪨 stone: ${stone}` : '',
                string ? `🕸 string: ${string}` : '',
                iron ? `⛓ iron: ${iron}` : '',
                diamond ? `💎 diamond: ${diamond}` : '',
                common ? `📦 common: ${common}` : '',
                uncommon ? `🛍 uncommon: ${uncommon}` : '',
                mythic ? `🎁 mythic: ${mythic}` : '',
                legendary ? `🗃 legendary: ${legendary}` : '',
                pet ? `🔖 pet token: ${pet}` : '',
            ].filter(Boolean)

            const img = await generateDungeonImage({
                players: P,
                rewards,
                losses,
                solo: true
            }).catch(() => null)
            if (img) await conn.sendFile(c1, img, 'dungeon.png', '🗡️ Dungeon Result', m)
            else conn.reply(c1, `losses:\n${losses.join('\n')}\n\nrewards:\n${rewards.join('\n')}`, m)

            if (mythic > 0) conn.reply(c1, `🎉 congrats! you got *${mythic}* mythic crate`, m)
            if (legendary > 0 || pet > 0) {
                let r = legendary > 0 && pet > 0 ? `*${legendary}* legendary & *${pet}* pet token` :
                    pet > 0 ? `*${pet}* pet token` : `*${legendary}* legendary crate`
                conn.reply(c1, `🎉 ${mythic > 0 ? 'and' : 'congrats!'} you got ${r}`, m)
            }

            if ((u.health * 1) < 1 || (u.sworddurability * 1) < 1) {
                let warn = []
                if ((u.sworddurability * 1) < 1) {
                    u.sword -= 1;
                    u.sworddurability = 0
                    warn.push(u.sword > 0 ? '⚔️ sword level reduced by 1' : '⚔️ sword destroyed! type *#craft sword*')
                }
                if ((u.health * 1) < 1) warn.push('❤️ health is 0! type *#heal*')
                conn.reply(c1, warn.join('\n'), m)
            }

            delete conn.dungeon[room.id]
        }, pickRandom([1000, 2000, 3000]))

        if (conn.dungeon && room.state == 'PLAYING') delete conn.dungeon[room.id]

    } else if (/^(gass?s?s?s?.?.?.?|mulai)$/i.test(txt)) {
        sendAll(`*room:* ${room.id}\n*players:*\n${P}`)

        for (let _p of PLAYER) {
            room.price.money += Math.floor(Math.random() * 41)
            room.price.exp += Math.floor(Math.random() * 76)
            room.game.sampah += Math.floor(Math.random() * 16)
            room.price.string += pickRandom([0, 0, 5, 10, 3, 4, 0, 1, 0, 0, 0, 0, 0, 0])
            room.price.kayu += pickRandom([0, 0, 0, 1, 10, 4, 5, 0, 0, 0, 0, 0, 0])
            room.price.batu += pickRandom([0, 0, 0, 5, 10, 3, 4, 1, 0, 0, 0, 0, 0, 0])
            room.game.common += pickRandom([0, 0, 0, 3, 4, 6, 1, 0, 0, 0, 0, 0, 0, 0, 0])
        }

        let users = global.db.data.users
        let n = PLAYER.length
        let {
            health,
            sword
        } = room.less
        let {
            exp,
            money,
            sampah: trash,
            potion,
            diamond,
            iron,
            kayu: wood,
            batu: stone,
            string,
            common,
            uncommon,
            mythic,
            legendary,
            pet,
            petfood
        } = room.price

        for (let i = 0; i < PLAYER.length; i++) {
            let p = PLAYER[i]
            setTimeout(() => {
                if (!users[p]) return
                users[p].health -= health * 1
                users[p].sworddurability -= sword * 1
                users[p].money += money * 1
                users[p].exp += exp * 1
                users[p].trash += trash * 1
                users[p].potion += potion * 1
                users[p].diamond += diamond * 1
                users[p].iron += iron * 1
                users[p].wood += wood * 1
                users[p].rock += stone * 1
                users[p].string += string * 1
                users[p].common += common * 1
                users[p].uncommon += uncommon * 1
                users[p].mythic += mythic * 1
                users[p].legendary += legendary * 1
                users[p].pet += pet * 1
                users[p].petfood += petfood * 1
                users[p].lastdungeon = Date.now()
                if ((users[p].health * 1) < 1) users[p].health = 0
                if ((users[p].sworddurability * 1) < 1) {
                    users[p].sword -= 1
                    users[p].sworddurability = (users[p].sword * 1) * 50
                }
            }, i * 1500)
        }

        setTimeout(async () => {
            const losses = [`❤️ health: -${health}`, `⚔️ sword durability: -${sword}`]
            const rewards = [
                `✨ exp: ${exp * n}`, `💰 money: ${money * n}`,
                `🗑 trash: ${trash * n}`,
                potion ? `🥤 potion: ${potion * n}` : '',
                petfood ? `🍖 petfood: ${petfood * n}` : '',
                wood ? `🪵 wood: ${wood * n}` : '',
                stone ? `🪨 stone: ${stone * n}` : '',
                string ? `🕸 string: ${string * n}` : '',
                iron ? `⛓ iron: ${iron * n}` : '',
                diamond ? `💎 diamond: ${diamond * n}` : '',
                common ? `📦 common: ${common * n}` : '',
                uncommon ? `🛍 uncommon: ${uncommon * n}` : '',
                mythic ? `🎁 mythic: ${mythic * n}` : '',
                legendary ? `🗃 legendary: ${legendary * n}` : '',
                pet ? `🔖 pet token: ${pet * n}` : '',
            ].filter(Boolean)

            const img = await generateDungeonImage({
                players: P,
                rewards,
                losses,
                solo: false
            }).catch(() => null)
            if (img) await sendImgAll(img, '🗡️ Dungeon Result')
            else sendAll(`losses:\n${losses.join('\n')}\n\nrewards:\n${rewards.join('\n')}`)
        }, pickRandom([1000, 2000, 3000]))

        if (mythic > 0)
            sendAll(`🎉 congrats ${P} — you all got *${mythic * n}* mythic crate!`)

        if (legendary > 0 || pet > 0) {
            let r = legendary > 0 && pet > 0 ? `*${legendary * n}* legendary & *${pet * n}* pet token` :
                pet > 0 ? `*${pet * n}* pet token` : `*${legendary * n}* legendary crate`
            sendAll(`🎉 ${mythic > 0 ? 'and' : `congrats ${P}!`} you got ${r}`)
        }

        let HEALT = [],
            SDH = [],
            SDM1L = []
        for (let p of PLAYER) {
            if (!users[p]) continue
            if ((users[p].health * 1) < 1) HEALT.push(p)
            if ((users[p].sworddurability * 1) < 1 && (users[p].sword * 1) == 1) SDH.push(p)
            if ((users[p].sworddurability * 1) < 1 && (users[p].sword * 1) !== 1) SDM1L.push(p)
        }
        if (HEALT.length || SDH.length || SDM1L.length) {
            let warn = []
            if (SDH.length) warn.push(`⚔️ sword ${data(SDH)} destroyed — type *#craft sword*`)
            if (SDM1L.length) warn.push(`⚔️ sword ${data(SDM1L)} level reduced by 1`)
            if (HEALT.length) warn.push(`❤️ health ${data(HEALT)} is 0 — type *#heal*`)
            sendAll(warn.join('\n'))
        }

        delete conn.dungeon[room.id]
    }

    if (conn.dungeon && room.state == 'PLAYING') delete conn.dungeon[room.id]
}

function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)]
}

function M(jid) {
    return '@' + jid.split('@')[0]
}

function data(arr) {
    return arr.map((p, i) => i === arr.length - 1 && arr.length > 1 ? `and *${M(p)}*` : `*${M(p)}*`).join(', ')
}


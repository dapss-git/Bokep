import {
    areJidsSameUser
} from 'baileys'

let toM = a => '@' + a.split('@')[0]

function resolveJidFromParticipants(jid, participants = []) {
    return (
        participants.find(p =>
            areJidsSameUser(p?.id, jid) ||
            areJidsSameUser(p?.jid, jid) ||
            areJidsSameUser(p?.lid, jid)
        )?.jid || jid
    )
}

let handler = async (m, {
    conn,
    participants
}) => {
    if (!participants || participants.length === 0) {
        const metadata = await conn.groupMetadata(m.chat)
        participants = metadata.participants
    }

    let user = global.db.data.users[m.sender]
    let pacar = user.pacar
    if (!pacar) return m.reply(`❌ Kamu belum punya pacar!\nGunakan *.tembak @user* untuk memulai kisah cinta.`)

    let pacarJid = resolveJidFromParticipants(pacar, participants)
    let senderJid = resolveJidFromParticipants(m.sender, participants)
    if (m.mentionedJid?.[0] && resolveJidFromParticipants(m.mentionedJid[0], participants) !== pacarJid)
        return m.reply(`❗ Kamu hanya boleh mencium pacarmu yang sah!\nJangan selingkuh dong~`)

    let __timers = (new Date - user.lastcium)
    let _timers = (1200000 - __timers)
    let timers = clockString(_timers)
    if (__timers < 1200000)
        return m.reply(`⏳ Sabar ya... tunggu ${timers} lagi untuk ciuman romantis~`)

    let name = await conn.getName(senderJid)
    let pacarName = await conn.getName(pacarJid)

    let gagal = Math.random() < 0.2

    if (gagal) {
        let gagalTeks = [
            `*${name}* mencoba mencipok *@${pacarJid.split('@')[0]}*...`,
            `Tapi *@${pacarJid.split('@')[0]}* malah menoleh ke arah lain...`,
            `☹️ "Eh jangan tiba-tiba dong~", katanya sambil tersipu.`,
            `*${name}* pun hanya bisa garuk-garuk kepala sambil tersenyum malu...`,
            `❤️‍🩹 Gagal ciuman kali ini, tapi cinta tetap bersemi kok~`
        ]
        for (let i = 0; i < gagalTeks.length; i++) {
            setTimeout(() => conn.reply(m.chat, gagalTeks[i], m, {
                mentions: [pacarJid]
            }), i * 3500)
        }
        user.lastcium = new Date * 1
        return
    }

    let rewardMoney = Math.floor(Math.random() * 1000) + 500
    let rewardExp = Math.floor(Math.random() * 50) + 20
    let lokasi = [
        'di taman bunga yang indah 🌸',
        'di tepi pantai saat sunset 🌅',
        'di bawah hujan rintik-rintik ☔',
        'di bioskop sambil nonton film romantis 🎬',
        'di balkon rumah ditemani teh hangat ☕',
        'di puncak bukit melihat bintang ✨',
        'di perpustakaan saat pura-pura belajar 📚',
        'di taman bermain sambil naik ayunan 🎠'
    ]
    let tempat = lokasi[Math.floor(Math.random() * lokasi.length)]

    let teks = [
        `❤️ *${name}* menggandeng tangan *@${pacarJid.split('@')[0]}* dan berjalan ${tempat}...`,
        `✨ Suasana terasa romantis... mata mereka saling menatap dalam diam.`,
        `☺️ Perlahan *${name}* mendekatkan wajahnya...`,
        `💋 *MWAAAH~* cipokan lembut mendarat di lidah *@${pacarJid.split('@')[0]}*`,
        `😳 *@${pacarJid.split('@')[0]}* tersipu... lalu membalas ciuman manis itu dengan senyum hangat.`,
        `🌹 Dunia seakan berhenti sejenak untuk mereka berdua.`,
        `🎁 *—[ Bonus Cipok ]—*\n\n💸 Uang: +${rewardMoney}\n✨ Exp: +${rewardExp}\n❤️ Total cium: ${(user.cium || 0) + 1}\n📥 Dosa Bertambah = +1\n📥 Total Dosa = ${(user.dosa || 0) + 1}`
    ]

    for (let i = 0; i < teks.length; i++) {
        setTimeout(() => conn.reply(m.chat, teks[i], m, {
            mentions: [pacarJid]
        }), i * 4000)
    }

    setTimeout(() => {
        conn.sendFile(m.chat, 'https://files.catbox.moe/x662kq.webp', 'cium.webp', '', m, true, {
            type: 'sticker'
        })
    }, teks.length * 4000)

    user.money += rewardMoney
    user.exp += rewardExp
    user.cium = (user.cium || 0) + 1
    user.lastcium = new Date * 1
    user.dosa = (user.dosa || 0) + 1
}

handler.help = ['cipok @pacar']
handler.tags = ['rpg']
handler.command = /^(cipok)$/i
handler.group = true
handler.premium = true
handler.register = true
handler.nsfw = true
export default handler

function clockString(ms) {
    let h = Math.floor(ms / 3600000)
    let m = Math.floor(ms / 60000) % 60
    let s = Math.floor(ms / 1000) % 60
    return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}
import {
    areJidsSameUser
} from 'baileys'

let handler = async (m, {
    conn,
    text,
    participants
}) => {
    let rawMention = m.mentionedJid?.[0] || m.quoted?.sender || (text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null)
    if (!rawMention) return m.reply(`🪬 Tag teman yang ingin kamu santet!\nContoh: *.santet @user*`)

    if (!participants || participants.length === 0) {
        const metadata = await conn.groupMetadata(m.chat)
        participants = metadata.participants
    }

    let targetUser = participants.find(p =>
        areJidsSameUser(p.id, rawMention) || areJidsSameUser(p.jid, rawMention) || areJidsSameUser(p.lid, rawMention)
    )?.jid || rawMention

    let ownerNumbers = global.owner.map(o => o[0] + '@s.whatsapp.net')

    if (targetUser === m.sender) return m.reply(`🙅‍♂️ Kamu tidak bisa menyantet dirimu sendiri!`)
    if (areJidsSameUser(targetUser, conn.user.jid)) return m.reply(`😇 Tidak bisa menyantet bot, terlalu suci!`)
    if (ownerNumbers.some(o => areJidsSameUser(o, targetUser))) return m.reply(`👑 Kamu tidak bisa menyantet Owner-ku tercinta!`)

    let user = global.db.data.users[m.sender]
    let target = global.db.data.users[targetUser]
    if (!user || !target) return m.reply(`⚠️ Terjadi kesalahan saat memuat data.`)

    const cooldown = 30 * 60 * 1000
    const now = Date.now()
    const remaining = cooldown - (now - (user.lastSantet || 0))
    if (remaining > 0) {
        const minutes = Math.ceil(remaining / 60000)
        return m.reply(`⏳ Santet sedang cooldown. Tunggu ${minutes} menit lagi.`)
    }

    user.lastSantet = now
    const senderName = '@' + m.sender.split('@')[0]
    const targetName = '@' + targetUser.split('@')[0]

    const special = Math.random() < 0.05
    const gagal = !special && Math.random() < 0.25

    const moneyGagal = getRandomInt(200_000, 1_000_000)
    const moneyBerhasil = getRandomInt(500_000, 1_000_000)
    const moneySpesial = 5_000_000

    const ceritaNormal = [
        `🔮 ${senderName} membuka kitab hitam dan membisikkan mantra...`,
        `🕯️ Lilin darah menyala. Angin dingin berhembus perlahan...`,
        `🐍 Boneka santet disiapkan. Energi ${targetName} mulai bergetar...`,
        `💀 Paku ditancapkan ke boneka dengan doa kutukan...`,
        `🪬 Aura kelam menyelimuti ruangan...`
    ]

    const ceritaSpesial = [
        `🌑 Langit mendadak gelap... ⚡ Petir menyambar bertubi-tubi...`,
        `🩸 Darah mengalir dari boneka, menandakan pengikatan sempurna.`,
        `🌀 Roh jahat turun menghantam tubuh astral ${targetName}...`,
        `⚰️ *Ritual Spesial Aktif!* Energi terkuras drastis!`,
        `☠️ ${targetName} hampir kehilangan kesadaran!`
    ]

    let hasil = ""
    if (special) {
        hasil = `
✨ *—[ RITUAL SANTET SPESIAL ]—*
⚠️ Ritual mencapai level *TERLARANG*!
➕ 💰 Money: +${toRupiah(moneySpesial)}
➕ ✨ Exp: +15.000
☠️ ${targetName} sekarat di alam astral...
        `.trim()
    } else if (gagal) {
        hasil = `
❌ *—[ SANTET GAGAL! ]—*
⚠️ Energi santet berbalik ke tubuhmu!
➖ 💰 Money: -${toRupiah(moneyGagal)}
➕ ✨ Exp: +3.000
💀 Backlash dari energi hitam menyakitimu...
        `.trim()
    } else {
        hasil = `
✅ *—[ SANTET BERHASIL ]—*
🔮 Energi ${targetName} berhasil diserap...
➕ 💰 Money: +${toRupiah(moneyBerhasil)}
➕ ✨ Exp: +8.000
🧘‍♂️ Tenagamu meningkat drastis!
        `.trim()
    }

    let initialMessage = await conn.sendMessage(m.chat, { text: "🕯️ *Ritual santet dimulai...*" }, { quoted: m });
    let key = initialMessage.key;
    await delay(1500);

    for (let c of special ? ceritaSpesial : ceritaNormal) {
        await delay(3000);
        await conn.sendMessage(m.chat, { text: c, edit: key });
    }

    if (special) {
        user.money = (user.money || 0) + moneySpesial
        user.exp = (user.exp || 0) + 15000
        user.dosa = (user.dosa || 0) + 1
        hasil += `\n📥 Dosa Bertambah = +1\n📥 Total Dosa = ${user.dosa}`
    } else if (gagal) {
        user.money = Math.max((user.money || 0) - moneyGagal, 0)
        user.exp = (user.exp || 0) + 3000
    } else {
        user.money = (user.money || 0) + moneyBerhasil
        user.exp = (user.exp || 0) + 8000
        user.dosa = (user.dosa || 0) + 1
        hasil += `\n📥 Dosa Bertambah = +1\n📥 Total Dosa = ${user.dosa}`
    }
    
    await delay(2000); // Jeda sejenak sebelum nampilin hasil akhir
    await conn.sendMessage(m.chat, { text: hasil, edit: key });

    setTimeout(() => {
        conn.reply(m.chat, `🪬 *Cooldown selesai!*\n${senderName}, kamu bisa melakukan santet lagi sekarang.`, m)
    }, cooldown)
}

handler.help = ['santet @user']
handler.tags = ['rpg']
handler.command = /^(santet)$/i
handler.group = true
handler.register = true
handler.premium = true

export default handler

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

function toRupiah(num) {
    return 'Rp' + num.toLocaleString('id-ID')
}
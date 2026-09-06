const spam = new Map()

async function before(m, {
    conn,
    isAdmin,
    isBotAdmin,
    isOwner,
    group
}) {
    if (!m.isGroup) return true
    if (m.fromMe) return true
    if (isAdmin || isOwner) return true // skip admin & owner

    const chatData = global.db.data.chats[m.chat] || {}
    const isEnabled = group?.antispam || chatData?.antispam || group?.antiSpam || chatData?.antiSpam

    if (!isEnabled) return true

    const now = Date.now()
    const userData = spam.get(m.sender) || {
        count: 0,
        lastTime: 0,
        warned: false
    }
    const diff = now - userData.lastTime

    if (diff > 4000) {
        userData.count = 1
        userData.warned = false
    } else {
        userData.count++
    }

    userData.lastTime = now
    spam.set(m.sender, userData)

    if (userData.count >= 3 && !userData.warned) {
        userData.warned = true
        spam.set(m.sender, userData)
        await conn.reply(m.chat, `⚠️ ANTI SPAM\n\nMaaf @${m.sender.split('@')[0]}, kecepatan pesan kamu terlalu tinggi!`, m, {
            mentions: [m.sender]
        })
        return false
    }

    if (userData.count >= 5) {
        if (isBotAdmin) {
            try {
                await conn.sendMessage(m.chat, {
                    delete: m.key
                })
            } catch {}
        }
        return false
    }

    return true
}

export {
    before
}
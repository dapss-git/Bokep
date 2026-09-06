const TARGETS = {
    users: 'Data semua pengguna',
    chats: 'Data semua grup',
    settings: 'Pengaturan bot',
    bots: 'Data bot (rating, replyText, dll)',
    stats: 'Statistik',
    guilds: 'Data guild',
}

let handler = async (m, {
    conn,
    text,
    db
}) => {
    const target = text?.trim()?.toLowerCase()

    if (!target || (!TARGETS[target] && target !== 'all')) {
        const list = Object.entries(TARGETS)
            .map(([k, v]) => `  • *${k}* — ${v}`)
            .join('\n')

        return m.reply(
            `*[ 🗄️ RESET DATABASE ]*\n\n` +
            `Gunakan: *.resetdb <target>*\n\n` +
            `*Target yang tersedia:*\n${list}\n` +
            `  • *all* — Reset semua data\n\n` +
            `⚠️ *Peringatan:* Data yang direset tidak bisa dikembalikan!`
        )
    }

    await m.react('⏳')

    try {
        const defaults = {
            users: {},
            chats: {},
            settings: {},
            bots: {},
            stats: {},
            guilds: {},
        }

        if (target === 'all') {
            const totalBefore = Object.keys(TARGETS)
                .reduce((acc, k) => acc + Object.keys(db.data[k] || {}).length, 0)

            for (const [k, v] of Object.entries(defaults)) {
                db.data[k] = v
            }
            await db.save()

            await m.react('✅')
            return m.reply(
                `*[ ✅ RESET SEMUA BERHASIL ]*\n\n` +
                `🗂️ *Target:* semua\n` +
                `📊 *Total entri dihapus:* ${totalBefore}\n` +
                `🔄 *Status:* Semua data direset ke default`
            )
        }

        const before = Object.keys(db.data[target] || {}).length

        db.data[target] = defaults[target]
        await db.save()

        await m.react('✅')
        return m.reply(
            `*[ ✅ RESET BERHASIL ]*\n\n` +
            `🗂️ *Target:* ${target}\n` +
            `📊 *Entri dihapus:* ${before}\n` +
            `🔄 *Status:* Direset ke default\n\n` +
            `_${TARGETS[target]} telah direset._`
        )
    } catch (err) {
        console.error('[resetdb]', err)
        await m.react('❌')
        return m.reply(`❌ Gagal reset *${target}*:\n\`\`\`${err.message}\`\`\``)
    }
}

handler.help = ['resetdb <target>']
handler.tags = ['owner']
handler.command = ['resetdb']
handler.owner = true
handler.register = true;

export default handler
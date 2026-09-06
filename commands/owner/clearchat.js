const handler = async (m, {
    conn,
    args,
    usedPrefix,
    command
}) => {
    const action = args[0]?.toLowerCase();
    const subAction = args[1]?.toLowerCase();

    if (!action || !["clear", "delete", "all"].includes(action))
        return m.reply(
            `╭─「 CLEARCHAT 」\n` +
            `│ Perintah:\n` +
            `│  ${usedPrefix + command} clear — hapus pesan di chat ini\n` +
            `│  ${usedPrefix + command} delete — hapus chat ini\n` +
            `│  ${usedPrefix + command} all — clear semua grup\n` +
            `│  ${usedPrefix + command} all delete — hapus semua chat (TOTAL)\n` +
            `╰─ ⚠️ Tidak bisa dibatalkan!`
        );

    await m.reply(`⏳ Memproses...`);

    try {
        const ts = m.messageTimestamp || Math.floor(Date.now() / 1000);

        if (action === "all") {
            if (subAction === "delete") {
                let chats = Object.keys(conn.chats);

                for (let jid of chats) {
                    const msgKey = {
                        id: m.key?.id,
                        remoteJid: jid,
                        fromMe: true,
                    };

                    const lastMessages = [{
                        key: msgKey,
                        messageTimestamp: ts
                    }];

                    await conn.chatModify({
                        delete: true,
                        lastMessages,
                    }, jid);
                }

                return m.reply(`🔥 Semua chat berhasil DIHAPUS TOTAL (${chats.length} chat).`);
            }

            const groupsData = await conn.groupFetchAllParticipating();
            const groups = Object.values(groupsData);

            for (let group of groups) {
                const jid = group.id;

                const msgKey = {
                    id: m.key?.id,
                    remoteJid: jid,
                    fromMe: true,
                };

                const lastMessages = [{
                    key: msgKey,
                    messageTimestamp: ts
                }];

                await conn.chatModify({
                    clear: true,
                    lastMessages,
                }, jid);
            }

            return m.reply(`✅ Semua grup berhasil dibersihkan (${groups.length} grup).`);
        }

        const msgKey = {
            id: m.key?.id,
            remoteJid: m.chat,
            fromMe: m.key?.fromMe ?? false,
            ...(m.isGroup && !m.key?.fromMe ? {
                participant: m.sender
            } : {}),
        };

        const lastMessages = [{
            key: msgKey,
            messageTimestamp: ts
        }];

        if (action === "clear") {
            await conn.chatModify({
                clear: true,
                lastMessages,
            }, m.chat);

            m.reply(`✅ Pesan di chat ini berhasil dihapus.`);

        } else if (action === "delete") {
            await conn.chatModify({
                delete: true,
                lastMessages,
            }, m.chat);

            m.reply(`✅ Chat ini berhasil dihapus.`);
        }

    } catch (e) {
        m.reply(`❌ Gagal: ${e.message}`);
    }
};

handler.command = ["clearchat"];
handler.tags = "owner";
handler.description = "Hapus pesan / chat (termasuk semua chat).";
handler.owner = true;
handler.register = true;

export default handler;
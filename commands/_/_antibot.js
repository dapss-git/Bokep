import {
    jidDecode,
    jidNormalizedUser
} from "baileys";

function decodeJid(jid) {
    if (!jid) return jid;

    try {
        const d = jidDecode(jid);
        return d?.user && d?.server ?
            d.user + "@" + d.server :
            jid;
    } catch {
        return jid;
    }
}

function getType(m) {
    return Object.keys(
        m.message || {}
    )[0];
}

function getText(m) {
    return (
        m.text ||
        m.message?.conversation ||
        m.message?.extendedTextMessage?.text ||
        m.message?.imageMessage?.caption ||
        m.message?.videoMessage?.caption ||
        m.message?.interactiveMessage?.body?.text ||
        m.message?.buttonsResponseMessage?.selectedButtonId ||
        m.message?.listResponseMessage?.title ||
        ""
    );
}

export async function before(m, {
    isAdmin,
    isBotAdmin,
    isOwner,
    conn
}) {

    const type = getType(m);
    const text = getText(m);

    if (m.isBaileys && m.fromMe) return true;
    if (!m.isGroup) return true;
    if (type === "reactionMessage") return true;

    const chat =
        global.db.data.chats[m.chat] || {};

    if (!chat.antibot) return true;

    if (!m.sender) return true;
    if (isAdmin || isOwner) return true;

    const botJid = jidNormalizedUser(conn.user?.jid || conn.user?.id || '');

    const sender = decodeJid(m.sender);

    if (sender === botJid) return true;

    let isBot = false;
    let reason = "";

    if (m.isBaileys && !m.fromMe) {
        isBot = true;
        reason = "baileys";
    }

    if (!isBot && m.key?.id) {

        const id = m.key.id;

        if (
            /^(BAE5|ILSYM)[0-9A-Z\-]+$/i.test(id) ||
            /STARFALL/i.test(id)
        ) {
            isBot = true;
            reason = "id pattern";
        }
    }

    if (!isBot && text) {

        const t = text.toLowerCase();

        if (
            text.length > 400 &&
            (
                t.includes("bot info") ||
                t.includes("powered by") ||
                t.includes("menu") ||
                t.includes("downloaders") ||
                t.includes("search") ||
                t.includes("runtime") ||
                t.includes("uptime")
            )
        ) {
            isBot = true;
            reason = "menu text";
        }
    }

    if (!isBot &&
        type === "imageMessage" &&
        text
    ) {

        const t = text.toLowerCase();

        if (
            t.includes("menu") ||
            t.includes("bot") ||
            t.includes("runtime") ||
            t.includes("uptime") ||
            t.split("\n").length > 10
        ) {
            isBot = true;
            reason = "menu image";
        }
    }

    if (!isBot &&
        type === "interactiveMessage"
    ) {

        const msg =
            m.message?.interactiveMessage || {};

        const raw =
            JSON.stringify(msg).toLowerCase();

        const bodyText =
            msg?.body?.text ||
            msg?.header?.title ||
            "";

        const footerText =
            msg?.footer?.text || "";

        const buttons =
            msg?.nativeFlowMessage?.buttons || [];

        const hasNativeFlow = !!msg?.nativeFlowMessage;

        const buttonRaw =
            JSON.stringify(buttons).toLowerCase();

        const hasMenuKeyword =
            /menu|allmenu|download|search|group|owner|tool|ai|maker|converter|profile|information/i
            .test(raw);

        const hasBotKeyword =
            /bot|powered by|developed by|library|runtime|uptime|database/i
            .test(raw);

        const hasMention =
            Array.isArray(
                msg?.contextInfo?.mentionedJid
            ) &&
            msg.contextInfo.mentionedJid.length > 0;

        const longBody =
            bodyText.length > 250;

        const suspiciousButtonCount =
            buttons.length >= 3;

        const containsMenuCommand =
            /\.menu|\.owner|\.donate|\.allmenu/i
            .test(buttonRaw);

        const starfallPattern =
            /starfall/i.test(
                m.key?.id || ""
            );

        if (
            (!bodyText && hasNativeFlow) ||
            (hasNativeFlow &&
                suspiciousButtonCount &&
                hasMenuKeyword) ||
            (hasNativeFlow &&
                containsMenuCommand) ||
            (hasBotKeyword &&
                longBody) ||
            (hasMention &&
                hasBotKeyword) ||
            (
                footerText
                .toLowerCase()
                .includes("developed by")
            ) ||
            starfallPattern
        ) {
            isBot = true;
            reason = "interactive bot menu";
        }
    }

    if (
        !isBot &&
        type === "extendedTextMessage" &&
        text
    ) {

        const t = text.toLowerCase();

        const keywords = [
            "menu",
            "bot",
            "prefix",
            "command",
            "info server",
            "library",
            "creator",
            "ram",
            "cores",
            "runtime",
            "uptime",
            "database",
            "daftar kategori",
            "info pengguna",
            "info bot",
            "rating bot",
            "server uptime",
            "premium",
            "downloader",
            "tools",
            "group",
            "maker",
            "anime",
            "payment",
            "snippet",
            "stalk",
            ".menu all"
        ];

        const hasKeyword =
            keywords.some(v =>
                t.includes(v)
            );

        const fancyUnicode =
            /[^\u0000-\u007f]/;

        const smallCaps =
            /[ᴀ-ᴢꜰ-ꜱᴛ-ᴢ❒❁◦]/i;

        const tooLong =
            text.length > 600;

        const tooManyLines =
            text.split("\n").length > 12;

        const menuPatterns = [
            "info pengguna",
            "info bot",
            "daftar kategori menu",
            "ketik .menu",
            ".menu all",
            "uptime",
            "server uptime",
            "rating bot",
            "premium",
            "downloader",
            "search",
            "tools",
            "owner",
            "group",
            "maker",
            "rpg",
            "anime",
            "payment",
            "snippet",
            "stalk"
        ];

        const menuHit =
            menuPatterns.filter(v =>
                t.includes(v)
            ).length;

        const decorativeMenu =
            /╭|╰|❁|◦❒|>/i
            .test(text);

        const manyCategories =
            (
                text.match(/◦❒/g) || []
            ).length >= 8;

        const menuCommandSpam =
            /\.menu\s/i.test(t);

        const ctx =
            m.message?.extendedTextMessage
            ?.contextInfo;

        const isForwarded =
            ctx?.isForwarded ||
            ctx?.forwardingScore > 0;

        if (
            (hasKeyword && tooLong) ||
            (fancyUnicode.test(text) && tooLong) ||
            (smallCaps.test(text) && tooLong) ||
            (tooManyLines && hasKeyword) ||
            (isForwarded && tooLong) ||
            (menuHit >= 4 && decorativeMenu) ||
            (manyCategories && decorativeMenu) ||
            (menuCommandSpam && menuHit >= 2)
        ) {
            isBot = true;
            reason = "extended menu spam";
        }
    }

    if (!isBot && !text) {

        if (
            [
                "interactiveMessage",
                "buttonsMessage",
                "templateMessage"
            ].includes(type)
        ) {
            isBot = true;
            reason = "empty structured";
        }
    }

    if (!isBot) return true;

    let botIsAdmin = isBotAdmin
    if (!botIsAdmin) {
        try {
            const meta = await conn.groupMetadata(m.chat)
            const botJidNorm = jidNormalizedUser(conn.user?.jid || conn.user?.id || '')
            botIsAdmin = meta.participants.some(p => {
                return jidNormalizedUser(p.id) === botJidNorm && (p.admin === 'admin' || p.admin === 'superadmin')
            })
        } catch {}
    }

    if (botIsAdmin) {
        try {
            const deleteKey = {
                remoteJid: jidNormalizedUser(m.chat),
                fromMe: false,
                id: m.key.id,
                participant: jidNormalizedUser(m.key.participant || m.sender)
            }
            await conn.sendMessage(m.chat, { delete: deleteKey })
        } catch (err) {
            console.error('[ANTIBOT] gagal hapus:', err)
        }
    }

    await conn.sendMessage(m.chat, {
        text: `⚠️ ANTIBOT

@${sender.split("@")[0]} terdeteksi bot (${reason})`,
        mentions: [sender]
    });

    if (botIsAdmin) {
        setTimeout(async () => {
            try {
                await conn.groupParticipantsUpdate(
                    m.chat,
                    [m.sender],
                    "remove"
                );
            } catch {}
        }, 2000);
    }

    return false;
}


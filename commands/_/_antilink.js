import {
    jidNormalizedUser
} from 'baileys'

const allLinkRegex =
    /((https?:\/\/)?(www\.)?([a-z0-9-]+\.)+[a-z]{2,})(\/\S)?/i

const gclinkRegex = /chat\.whatsapp\.com\/(?:invite\/)?[0-9A-Za-z]{20,24}/i
const walinkRegex = /(?:https?:\/\/)?wa\.me\/\d+(?:\S)/i
const waChannelRegex = /whatsapp\.com\/channel\/[0-9A-Za-z]+/i

const urlRegex = /(https?:\/\/(?:www\.|(?!www))[^\s]+\.[^\s]{2,})/gi

const PLATFORM_PATTERNS = [
    /youtube\.com|youtu\.be/,
    /music\.youtube\.com/,
    /tiktok\.com/,
    /instagram\.com/,
    /facebook\.com|fb\.watch/,
    /twitter\.com|x\.com/,
    /pinterest\.com/,
    /snackvideo|sck\.io/,
    /likee\.video|like\.video/,
    /capcut\.com/,
    /vimeo\.com/,
    /dailymotion\.com/,
    /reddit\.com/,
    /bilibili\.com|b23\.tv/,
    /soundcloud\.com/,
    /spotify\.com/,
    /twitch\.tv/,
    /vk\.com/,
    /threads\.net/,
    /streamable\.com/,
    /coub\.com/,
    /imgur\.com/,
    /9gag\.com/,
    /douyin\.com/,
    /weibo\.com/,
    /\.(mp4|m3u8|mp3|webm|mkv|mov|avi|flv)(\?|$)/i
]

function isAllowedLink(text) {
    const matches = text.match(urlRegex)
    if (!matches) return false
    for (let url of matches) {
        const clean = url.toLowerCase()
        if (PLATFORM_PATTERNS.some(r => r.test(clean))) return true
    }
    return false
}

function getCommand(m, text) {
    const userData = global.db.data.users[m.sender] || {}
    const chatData = global.db.data.chats[m.chat] || {}

    let customPrefix = null
    if (userData.customPrefix) {
        customPrefix = userData.customPrefix
    } else if (m.isGroup && chatData.customPrefix) {
        customPrefix = chatData.customPrefix
    }

    const prefix = customPrefix ?
        (text.startsWith(customPrefix) ?
            customPrefix :
            (/^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/.test(text) ?
                text.match(/^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/gi)?.[0] :
                null)) :
        (/^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/.test(text) ?
            text.match(/^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/gi)?.[0] :
            null)

    if (!prefix || !text.startsWith(prefix)) return {
        isCommand: false
    }

    const args = text.slice(prefix.length).trim().split(/ +/)
    const command = args.shift()?.toLowerCase()

    return {
        isCommand: !!command
    }
}

function extractAllText(m) {
    const texts = []

    const main =
        m.text ||
        m.message?.conversation ||
        m.message?.extendedTextMessage?.text ||
        m.message?.imageMessage?.caption ||
        m.message?.videoMessage?.caption ||
        ''
    if (main) texts.push(main)

    const btn = m.message?.buttonsMessage
    if (btn) {
        if (btn.contentText) texts.push(btn.contentText)
        if (btn.footerText) texts.push(btn.footerText)
        for (const b of btn.buttons || []) {
            if (b.buttonText?.displayText) texts.push(b.buttonText.displayText)
        }
    }

    const btnRes = m.message?.buttonsResponseMessage
    if (btnRes?.selectedDisplayText) texts.push(btnRes.selectedDisplayText)

    const list = m.message?.listMessage
    if (list) {
        if (list.title) texts.push(list.title)
        if (list.description) texts.push(list.description)
        if (list.footerText) texts.push(list.footerText)
        for (const sec of list.sections || []) {
            if (sec.title) texts.push(sec.title)
            for (const row of sec.rows || []) {
                if (row.title) texts.push(row.title)
                if (row.description) texts.push(row.description)
            }
        }
    }

    const listRes = m.message?.listResponseMessage
    if (listRes) {
        if (listRes.title) texts.push(listRes.title)
        if (listRes.singleSelectReply?.selectedRowId) texts.push(listRes.singleSelectReply.selectedRowId)
    }

    const tpl = m.message?.templateMessage?.hydratedTemplate
    if (tpl) {
        if (tpl.hydratedContentText) texts.push(tpl.hydratedContentText)
        for (const b of tpl.hydratedButtons || []) {
            if (b.urlButton?.displayText) texts.push(b.urlButton.displayText)
            if (b.urlButton?.url) texts.push(b.urlButton.url)
            if (b.callButton?.displayText) texts.push(b.callButton.displayText)
            if (b.quickReplyButton?.displayText) texts.push(b.quickReplyButton.displayText)
        }
    }

    const interactive = m.message?.interactiveMessage
    if (interactive) {
        if (interactive.body?.text) texts.push(interactive.body.text)
        if (interactive.footer?.text) texts.push(interactive.footer.text)
        if (interactive.header?.subtitle) texts.push(interactive.header.subtitle)
        const nfm = interactive.nativeFlowMessage
        if (nfm?.paramsJson) {
            try {
                const parsed = JSON.parse(nfm.paramsJson)
                const walk = (obj) => {
                    if (!obj || typeof obj !== 'object') return
                    for (const v of Object.values(obj)) {
                        if (typeof v === 'string') texts.push(v)
                        else walk(v)
                    }
                }
                walk(parsed)
            } catch {}
        }
    }

    const poll = m.message?.pollCreationMessage || m.message?.pollCreationMessageV2 || m.message?.pollCreationMessageV3
    if (poll) {
        if (poll.name) texts.push(poll.name)
        for (const opt of poll.options || []) {
            if (opt.optionName) texts.push(opt.optionName)
        }
    }

    const pollVote = m.message?.pollUpdateMessage
    if (pollVote?.vote?.optionName) texts.push(pollVote.vote.optionName)

    return texts.join(' ')
}

export async function before(m, {
    isAdmin,
    isBotAdmin,
    conn
}) {
    if (m.isBaileys || m.fromMe) return true
    if (!m.isGroup) return true

    const group = global.db.data.chats[m.chat] || {}

    const antilinkGcEnabled = group.antiLinkGc || group.antilinkgc || false

    if (antilinkGcEnabled && !isAdmin) {
        const fullText = extractAllText(m)
        if (gclinkRegex.test(fullText)) {
            return await deleteMessage(m, conn, isBotAdmin)
        }
    }

    const text =
        m.text ||
        m.message?.conversation ||
        m.message?.extendedTextMessage?.text ||
        m.message?.imageMessage?.caption ||
        m.message?.videoMessage?.caption ||
        ''

    if (!text) return true

    const {
        isCommand
    } = getCommand(m, text)
    if (isCommand) return true

    const isAnyLink = allLinkRegex.test(text)
    const isWaLink = walinkRegex.test(text)
    const isWaChannel = waChannelRegex.test(text)

    const isAllowed = group.autodownload && isAllowedLink(text)

    const antilinkWaEnabled = group.antiLinkWa || group.antilinkwa || false

    const shouldDelete =
        (group.antilink && isAnyLink && !isAdmin && !isAllowed) ||
        (antilinkWaEnabled && (isWaLink || isWaChannel) && !isAdmin)

    if (!shouldDelete) return true

    return await deleteMessage(m, conn, isBotAdmin)
}

async function deleteMessage(m, conn, isBotAdmin) {
    let botIsAdmin = isBotAdmin

    if (!botIsAdmin) {
        try {
            const meta = await conn.groupMetadata(m.chat)
            const botJid = jidNormalizedUser(conn.user?.jid || conn.user?.id || '')
            botIsAdmin = meta.participants.some(p =>
                jidNormalizedUser(p.id) === botJid && (p.admin === 'admin' || p.admin === 'superadmin')
            )
        } catch {}
    }

    if (!botIsAdmin) return true

    try {
        await conn.sendMessage(m.chat, {
            delete: {
                remoteJid: jidNormalizedUser(m.chat),
                fromMe: false,
                id: m.key.id,
                participant: jidNormalizedUser(m.key.participant || m.sender)
            }
        })
    } catch {}

    return false
}


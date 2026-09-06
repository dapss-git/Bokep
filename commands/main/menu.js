import os from "os";
import fs from "fs";
import moment from "moment-timezone";
import {
    toPTT
} from "../../library/converter.js";
import {
    generateWAMessageFromContent,
    prepareWAMessageMedia
} from "baileys";

const CATEGORY_EMOJI = {
    admin: "🛡️",
    ai: "🤖",
    anime: "⛩️",
    anomali: "⚡",
    audio: "🎵",
    bug: "🪲",
    bypass: "🔓",
    canvas: "🎨",
    category: "📂",
    cewerandom: "🎲",
    deploy: "🚀",
    download: "📥",
    fun: "🎉",
    game: "🕹️",
    github: "🐙",
    group: "👥",
    image: "🖼️",
    info: "📡",
    internet: "🌐",
    islam: "🌙",
    maker: "🛠️",
    main: "🏠",
    meme: "🤡",
    nsfw: "🔞",
    owner: "💓",
    premium: "💎",
    quotes: "💬",
    rpg: "⚔️",
    search: "🔍",
    snippet: "🧩",
    stalk: "🕵️",
    sticker: "🖼️",
    tools: "🧰",
    xp: "✨",
};

const CAT_ORDER = [
    "admin", "ai", "anime", "anomali", "audio", "bug", "bypass", "canvas",
    "category", "cewerandom", "deploy", "download", "fun", "game", "github", "group",
    "image", "info", "internet", "islam", "maker", "main", "meme", "nsfw",
    "owner", "premium", "quotes", "rpg", "search", "snippet", "stalk",
    "sticker", "tools", "xp"
];

const getEmoji = tag => CATEGORY_EMOJI[tag?.toLowerCase()] || "📂";

const getGreeting = hour => {
    if (hour >= 4 && hour < 11) return "Selamat Pagi 🌅";
    if (hour >= 11 && hour < 15) return "Selamat Siang ☀️";
    if (hour >= 15 && hour < 19) return "Selamat Sore 🌇";
    return "Selamat Malam 🌙";
};

const handler = async (m, {
    conn,
    user,
    isOwner,
    isPremium,
    cmd,
    Func,
    text,
    usedPrefix
}) => {
    const botname = global.botname || "Bot";
    const prefixMatch = m.text?.match(/^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/);
    const prefix = prefixMatch ? prefixMatch[0] : usedPrefix || ".";

    const menu = {};
    Object.values(cmd.plugins).forEach(plugin => {
        if (!plugin.help || !plugin.tags) return;

        let tags = Array.isArray(plugin.tags) ? plugin.tags : plugin.tags.split(",").map(t => t.trim());
        tags = tags.map(t => {
            const low = t.toLowerCase();
            if (low === "random") return "cewerandom";
            if (low === "downloader") return "download";
            return low;
        });

        if (plugin.owner && !tags.includes("owner")) tags.push("owner");
        if (plugin.premium && !tags.includes("premium")) tags.push("premium");

        let helps = Array.isArray(plugin.help) ? plugin.help : [plugin.help];
        helps.forEach(h => {
            const cmdName = (h || "").split(" ")[0].toLowerCase();
            if (!cmdName) return;

            tags.forEach(tag => {
                if (!menu[tag]) menu[tag] = [];
                if (!menu[tag].includes(cmdName)) menu[tag].push(cmdName);
            });
        });
    });

    const sortedTags = Object.keys(menu).sort((a, b) => {
        const ia = CAT_ORDER.indexOf(a);
        const ib = CAT_ORDER.indexOf(b);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
    sortedTags.forEach(tag => menu[tag].sort((a, b) => a.localeCompare(b)));

    const uptime = Func.toTime(Number(process.uptime()) * 1000);
    const serverUptime = Func.toTime(Number(os.uptime()) * 1000);
    const groupCount = Object.keys(await conn.groupFetchAllParticipating()).length;
    const totalUser = Object.keys(global.db.data.users || {}).length;
    const ownerCount = (global.owner || []).filter(o => Array.isArray(o) ? o[2] !== false : true).length +
        (global.db.data.owner?.length || 0);

    const ratings = global.db.data.bots?.rating || {};
    const ratingValues = Object.values(ratings).map(r => parseInt(r.rate) || 0);
    const avgRating = ratingValues.length ? (ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length).toFixed(1) : "-";

    const isRegistered = !!(user?.registered || user?.reg || user?.isRegistered);
    const userStatus = isOwner ? "Owner" : isPremium ? "Premium" : isRegistered ? "Free User" : "Unregistered";
    const limitLabel = isOwner || isPremium ? "∞" : String(parseInt(user?.limit) || 0);

    const now = moment().tz("Asia/Jakarta");
    const timeNow = now.format("HH:mm");
    const greeting = getGreeting(now.hour());

    const imagePath = "./media/menu.jpg";
    const imageBuffer = fs.existsSync(imagePath) ? fs.readFileSync(imagePath) : null;

    // =============== SUBMENU ===============
    if (text) {
        const requestedTag = text.toLowerCase().trim();
        let caption = `*MENU ${requestedTag.toUpperCase()}*\n\n`;

        if (requestedTag === "all") {
            for (const tag of sortedTags) {
                caption += `${getEmoji(tag)} ${tag.toUpperCase()}\n`;
                menu[tag].forEach(c => caption += `• ${prefix}${c}\n`);
                caption += '\n';
            }
        } else if (menu[requestedTag]) {
            menu[requestedTag].forEach(c => caption += `• ${prefix}${c}\n`);
        } else {
            return m.reply(`❌ Kategori "${requestedTag}" tidak ditemukan.`);
        }

        return m.reply(caption.trim());
    }

    // =============== MENU UTAMA ===============
    const totalAllCmd = sortedTags.reduce((acc, tag) => acc + menu[tag].length, 0);

    const headerName = botname;
    const headerAddress = `⏱ ${uptime} · ◷ ${timeNow} WIB`;

    const contentText = `ʜᴀʟᴏ, @${m.sender.split('@')[0]}\n${greeting} ☀️`;

    const footerText = `┌ 『 𝗜𝗡𝗙𝗢 𝗨𝗦𝗘𝗥 』\n` +
        `├◇ ɴᴀᴍᴀ    : ${m.pushName || user.name || '-'}\n` +
        `├◇ ɴᴏᴍᴏʀ   : ${m.sender.split('@')[0]}\n` +
        `├◇ ʀᴏʟᴇ    : ${userStatus}\n` +
        `├◇ ᴛᴀɴɢɢᴀʟ : ${now.format('DD-MM-YYYY')}\n` +
        `├◇ ᴡᴀᴋᴛᴜ   : ${timeNow} ᴡɪʙ\n` +
        `└◈───────────◈\n\n` +
        `┌ 『 𝗜𝗡𝗙𝗢 𝗕𝗢𝗧 』\n` +
        `├◇ ɴᴀᴍᴀ    : ${botname}\n` +
        `├◇ ᴏᴡɴᴇʀ   : ${ownerCount} orang\n` +
        `├◇ ᴠᴇʀsɪ   : ${global.versi || '-'}\n` +
        `├◇ ꜰɪᴛᴜʀ   : ${totalAllCmd} command\n` +
        `├◇ ᴘɪɴɢ    : ${process.uptime().toFixed(2)}s\n` +
        `└◈───────────◈\n\n` +
        `↓ 𝘵𝘢𝘱 𝘵𝘰𝘮𝘣𝘰𝘭 𝘮𝘦𝘯𝘶 𝘥𝘪 𝘣𝘢𝘸𝘢𝘩 𝘶𝘯𝘵𝘶𝘬 𝘭𝘪𝘩𝘢𝘵 ꜰɪᴛᴜʀ`;

    // Bangun rows kategori untuk tombol single_select
    const categoryRows = [{
            title: "⌥ sᴇᴍᴜᴀ ᴄᴏᴍᴍᴀɴᴅ",
            description: `ʟɪʜᴀᴛ sᴇᴍᴜᴀ ${totalAllCmd} ᴄᴏᴍᴍᴀɴᴅ`,
            id: `.menu all`
        },
        ...sortedTags.map(tag => ({
            title: `${getEmoji(tag)} ${tag.toUpperCase()}`,
            description: `ʙᴇʀɪsɪ ${menu[tag].length} ᴄᴏᴍᴍᴀɴᴅ`,
            id: `.menu ${tag}`
        }))
    ];

    const buttonsMessage = {
        locationMessage: {
            name: headerName,
            address: headerAddress,
            jpegThumbnail: imageBuffer || undefined,
            url: ``
        },
        contentText,
        footerText,
        contextInfo: {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: "-",
                serverMessageId: 127,
                newsletterName: "Saluran"
            }
        },
        buttons: [{
                buttonId: "kategori",
                buttonText: {
                    displayText: "⌥ ᴍᴇɴᴜ"
                },
                type: 1,
                nativeFlowInfo: {
                    name: "single_select",
                    paramsJson: JSON.stringify({
                        title: "⌥ ᴍᴇɴᴜ",
                        sections: [{
                                title: "✦ ᴜᴍᴜᴍ",
                                rows: [{
                                    title: "⌥ sᴇᴍᴜᴀ ᴄᴏᴍᴍᴀɴᴅ",
                                    description: `ʟɪʜᴀᴛ sᴇᴍᴜᴀ ${totalAllCmd} ᴄᴏᴍᴍᴀɴᴅ`,
                                    id: ".menu all"
                                }]
                            },
                            {
                                title: "✦ ᴋᴀᴛᴇɢᴏʀɪ ꜰɪᴛᴜʀ",
                                rows: categoryRows
                            }
                        ]
                    })
                }
            },
            {
                buttonId: ".owner",
                buttonText: {
                    displayText: "⎋ ᴏᴡɴᴇʀ"
                },
                type: 1
            }
        ],
        headerType: 6
    };

    await conn.relayMessage(
        m.chat, {
            buttonsMessage
        }, {
            quoted: m,
            additionalNodes: [{
                tag: "biz",
                attrs: {},
                content: [{
                    tag: "interactive",
                    attrs: {
                        type: "native_flow",
                        v: "1"
                    },
                    content: [{
                        tag: "native_flow",
                        attrs: {
                            v: "9",
                            name: "mixed"
                        }
                    }]
                }]
            }]
        }
    );

    // Kirim audio jika ada
    try {
        const audioPath = "./media/menu.mp3";
        if (fs.existsSync(audioPath)) {
            const {
                data,
                delete: deleteFile
            } = await toPTT(fs.readFileSync(audioPath), "mp3");
            await conn.sendFile(m.chat, data, 'menu.ogg', '', m, {
                ptt: true,
                mimetype: 'audio/ogg; codecs=opus'
            });
            await deleteFile();
        }
    } catch (e) {
        console.warn("Gagal kirim audio menu:", e.message);
    }
};

handler.help = ["menu"];
handler.command = ["menu"];
handler.tags = ["main"];
handler.register = true;

export default handler;
import axios from "axios"

const urlRegex = /(https?:\/\/(?:www\.|(?!www))[^\s]+\.[^\s]{2,})/gi

const PLATFORM_PATTERNS = [{
        name: "YouTube",
        regex: /youtube\.com|youtu\.be/
    },
    {
        name: "YouTube Music",
        regex: /music\.youtube\.com/
    },
    {
        name: "TikTok",
        regex: /tiktok\.com/
    },
    {
        name: "Instagram",
        regex: /instagram\.com/
    },
    {
        name: "Facebook",
        regex: /facebook\.com|fb\.watch/
    },
    {
        name: "Twitter",
        regex: /twitter\.com|x\.com/
    },
    {
        name: "Pinterest",
        regex: /pinterest\.com/
    },
    {
        name: "SnackVideo",
        regex: /sck\.io|snackvideo/
    },
    {
        name: "Likee",
        regex: /likee\.video|like\.video/
    },
    {
        name: "Capcut",
        regex: /capcut\.com/
    },
    {
        name: "Vimeo",
        regex: /vimeo\.com/
    },
    {
        name: "Dailymotion",
        regex: /dailymotion\.com/
    },
    {
        name: "Reddit",
        regex: /reddit\.com/
    },
    {
        name: "Bilibili",
        regex: /bilibili\.com|b23\.tv/
    },
    {
        name: "SoundCloud",
        regex: /soundcloud\.com/
    },
    {
        name: "Spotify",
        regex: /spotify\.com/
    },
    {
        name: "Twitch",
        regex: /twitch\.tv/
    },
    {
        name: "VK",
        regex: /vk\.com/
    },
    {
        name: "Threads",
        regex: /threads\.net/
    },
    {
        name: "Streamable",
        regex: /streamable\.com/
    },
    {
        name: "Coub",
        regex: /coub\.com/
    },
    {
        name: "Imgur",
        regex: /imgur\.com/
    },
    {
        name: "9GAG",
        regex: /9gag\.com/
    },
    {
        name: "Douyin",
        regex: /douyin\.com/
    },
    {
        name: "Weibo",
        regex: /weibo\.com/
    },
    {
        name: "Direct",
        regex: /\.(mp4|m3u8|mp3|webm|mkv|mov|avi|flv)(\?|$)/i
    }
]

function detectPlatform(url) {
    try {
        const clean = url.toLowerCase()
        for (const p of PLATFORM_PATTERNS) {
            if (p.regex.test(clean)) return p.name
        }
        return null
    } catch {
        return null
    }
}

global.autodownload = global.autodownload || new Map()

export async function before(m, {
    conn
}) {
    try {
        if (m.isBaileys || m.fromMe) return true
        if (!m.isGroup) return true
        if (!m.text) return true
        if (/^(=>|>|\.|#|!|\/)/.test(m.text)) return true

        const group = global.db.data.chats[m.chat] || {}
        if (group.autodownload !== true) return true

        const matches = m.text.match(urlRegex)
        if (!matches) return true

        if (global.autodownload.has(m.sender)) return true
        global.autodownload.set(m.sender, true)

        await conn.readMessages([m.key]).catch(() => {})

        for (let raw of matches) {
            let link = raw.replace(/[),.]+$/, "")
            const platform = detectPlatform(link)
            if (!platform) continue

            try {
                const url = global.API(
                    "theresav",
                    "/download/aio-v2", {
                        url: link,
                        mode: "hybrid",
                        quality: "1080",
                        audio_quality: "320k"
                    },
                    "apikey"
                )

                const {
                    data
                } = await axios.get(url).catch(() => ({}))
                if (!data?.status) continue

                const result = data.result

                if (result?.type === "image" || result?.slides) {
                    const album = (Array.isArray(result.slides) && result.slides.length) ?
                        result.slides.map(v => ({
                            image: {
                                url: v
                            },
                            caption: ""
                        })) :
                        [{
                            image: {
                                url: result.download_url
                            },
                            caption: ""
                        }]

                    if (album.length) {
                        await conn.sendAlbumMessage(m.chat, album, {
                            quoted: m,
                            delay: 500
                        })
                    }
                    continue
                }

                if (result?.download_url) {
                    await conn.sendMessage(
                        m.chat, {
                            video: {
                                url: result.download_url
                            },
                            caption: ""
                        }, {
                            quoted: m
                        }
                    )
                }

                if (result?.audio_url) {
                    await conn.sendMessage(
                        m.chat, {
                            audio: {
                                url: result.audio_url
                            },
                            mimetype: "audio/mpeg"
                        }, {
                            quoted: m
                        }
                    )
                }

            } catch (e) {
                console.error("DL error:", e)
            }
        }

    } catch (e) {
        console.error("[AUTODL ERROR]", e)
    } finally {
        global.autodownload.delete(m.sender)
    }

    return true
}


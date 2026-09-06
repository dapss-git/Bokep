const urlRegex = /(https?:\/\/[^\s]+)/gi

const handler = async (m, {
    conn,
    text
}) => {
    try {
        if (!text) return m.reply("Masukkan URL!")

        const match = text.match(urlRegex)
        if (!match) return m.reply("URL tidak valid.")

        const link = match[0].replace(/[),.]+$/, "")

        await m.reply("⏳ Sedang memproses...")

        const apiUrl = global.API(
            "theresav",
            "/download/aio-v2", {
                url: link,
                mode: "hybrid",
                quality: "2160",
                audio_quality: "320k"
            },
            "apikey"
        )

        const resFetch = await fetch(apiUrl).catch(() => null)
        if (!resFetch) return m.reply("Gagal mengambil data.")

        const data = await resFetch.json().catch(() => null)
        if (!data?.status) return m.reply("Gagal mengambil data.")

        const res = data.result

        if (res?.type === "image" || res?.slides) {
            const album = (Array.isArray(res.slides) && res.slides.length) ?
                res.slides.map(v => ({
                    image: {
                        url: v
                    },
                    caption: ""
                })) : [{
                    image: {
                        url: res.download_url
                    },
                    caption: ""
                }]

            if (album.length) {
                await conn.sendAlbumMessage(m.chat, album, {
                    quoted: m,
                    delay: 500
                })
            }
            return
        }

        if (res?.download_url) {
            await conn.sendMessage(m.chat, {
                video: {
                    url: res.download_url
                },
                caption: "✅ Done"
            }, {
                quoted: m
            })
        }

        if (res?.audio_url) {
            await conn.sendMessage(m.chat, {
                audio: {
                    url: res.audio_url
                },
                mimetype: "audio/mpeg"
            }, {
                quoted: m
            })
        }

    } catch (e) {
        console.error(e)
        m.reply("Terjadi error.")
    }
}

handler.help = ['aio <url>']
handler.tags = ['downloader']
handler.command = /^aio$/i
handler.limit = true

handler.register = true

export default handler
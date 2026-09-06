import axios from "axios"

async function getBuild(hero) {
    let url = API('theresav', '/game/ml/build', {
        hero
    }, 'apikey')
    let res = await fetch(url)
    let data = await res.json()

    if (!data?.status) throw new Error("Hero tidak ditemukan")

    return data
}

let handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {

    if (!text) {
        return m.reply(`Contoh:\n${usedPrefix + command} marcel`)
    }

    // jika user klik build
    if (text.includes("|")) {

        const [hero, id] = text.split("|")

        let url = `https://api.theresav.biz.id/canvas/ml/build?hero=${hero}&id=${id}`
        let res = await fetch(url)
        let img = Buffer.from(await res.arrayBuffer())

        await conn.sendMessage(
            m.chat, {
                image: img,
                caption: `🎮 *Mobile Legends Build*\nHero: *${hero}*`
            }, {
                quoted: m
            }
        )

        return
    }

    await m.reply("🔎 Mencari build hero...")

    try {

        const res = await getBuild(text)

        const hero = res.hero.name
        const builds = res.builds

        const rows = builds.map((b, i) => ({
            header: `Build ${i + 1}`,
            title: b.title || "Build ML",
            description: `Author: ${b.author.username}`,
            id: `${usedPrefix + command} ${hero}|${b.id}`
        }))

        await conn.sendMessage(
            m.chat, {
                image: {
                    url: res.hero.image_url
                },
                caption: `🎮 *ML Build Finder*\n` +
                    `Hero: *${hero}*\n` +
                    `Role: ${res.hero.roles.join(", ")}\n` +
                    `Total Build: ${res.total_builds}`,
                footer: "Pilih build untuk melihat item",
                buttons: [{
                    buttonId: "ml_build",
                    buttonText: {
                        displayText: "⚔️ Pilih Build"
                    },
                    type: 4,
                    nativeFlowInfo: {
                        name: "single_select",
                        paramsJson: JSON.stringify({
                            title: "Daftar Build",
                            sections: [{
                                title: "Build List",
                                rows
                            }]
                        })
                    }
                }],
                headerType: 1,
                viewOnce: true
            }, {
                quoted: m
            }
        )

    } catch (e) {
        console.error("[MLBUILD ERROR]", e)
        m.reply("❌ Build hero tidak ditemukan")
    }
}

handler.help = ["buildml <hero>"]
handler.tags = ["search"]
handler.command = ["buildml"]
handler.register = true;

export default handler
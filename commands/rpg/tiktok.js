import {
    tmpdir
} from 'os'
import path from 'path'

let handler = async (m, {
    conn
}) => {
    let user = global.db.data.users[m.sender]
    if (!user.tiktok) return m.reply('Kamu belum memiliki profil TikTok. Buat terlebih dahulu dengan perintah *!createtiktok*')

    const cooldown = 30 * 60 * 1000
    const now = Date.now()
    const remaining = cooldown - (now - user.lasttiktokkonten)
    if (remaining > 0) return m.reply(`Tunggu *${clockString(remaining)}* sebelum membuat konten lagi.`)

    await m.reply('Sedang mengupload konten TikTok di akun tiktok kamu💫...')

    let keywordList = ['jj 3d anime', 'lirik anime sad', 'amv anime', 'crypto', 'invest']
    let keyword = keywordList[Math.floor(Math.random() * keywordList.length)]

    let api = await global.fetch(global.API("https://tikwm.com", "/api/feed/search", {
        keywords: keyword,
        count: 20
    }))

    let {
        data
    } = await api.json()
    if (!data.videos || data.videos.length < 1) return m.reply("Gagal mencari konten TikTok.")

    let selected = data.videos[Math.floor(Math.random() * data.videos.length)]
    let videoUrl = selected.play
    let views = selected.play_count

    let res = await conn.getFile(videoUrl)
    let filePath = path.join(tmpdir(), `${m.sender}_tiktok.mp4`)

    const fs = await import('fs')
    fs.default.writeFileSync(filePath, res.data)

    let followerGain = Math.floor(Math.random() * 25) + 1
    let moneyGain = followerGain * 1500

    user.konten += 1
    user.follower += followerGain
    user.money += moneyGain
    user.lasttiktokkonten = now

    user.tiktok.konten = user.konten
    user.tiktok.follower = user.follower
    user.tiktok.uang = user.money

    await new AIRich(conn)
        .setTitle('🎬 TikTok Upload')
        .setFooter('Auto Content System')
        .addVideo(`${videoUrl}|0`)
        .send(m.chat, {
            quoted: m
        })

    fs.default.unlinkSync(filePath)
}

handler.command = /^kontentiktok|uploadtiktok$/i
handler.help = ['kontentiktok']
handler.tags = ['rpg']
handler.register = true
handler.group = true
handler.rpg = true
handler.limit = true

export default handler

function clockString(ms) {
    let h = Math.floor(ms / 3600000)
    let m = Math.floor(ms / 60000) % 60
    let s = Math.floor(ms / 1000) % 60
    return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}
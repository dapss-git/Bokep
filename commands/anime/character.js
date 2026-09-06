import axios from 'axios'
import * as cheerio from 'cheerio'
const handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {
    try {
        if (!text) return m.reply(`Masukan Nama Character! \n\nContoh : \n${usedPrefix + command} Elaina`)
        await global.loading(m, conn)
        const {
            name,
            image,
            detail,
            voice_actor,
            animeography,
            mangaography
        } = await character(text)
        const caption = `
Name : ${name}

${detail.replace('>', '').trim()}

Anime :
${animeography.map(v => `• ${v.name} ( ${v.status} )`).join('\n')}

Manga :
${mangaography.map(v => `• ${v.name} ( ${v.status} )`).join('\n')}

Voice Actor : 
${voice_actor.map(v => `• ${v.name} ( ${v.origin} )`).join('\n')}
`.trim()

        await conn.sendFile(m.chat, image, false, caption, m)
    } catch (e) {
        throw e
    } finally {
        await global.loading(m, conn, true)
    }
}
handler.help = ['character']
handler.tags = ['anime']
handler.command = /^(chara(cter)?)$/i
handler.limit = true

handler.register = true

export default handler

async function character(q) {
    return new Promise((resolve, reject) => {
        axios.get('https://myanimelist.net/character.php?cat=character&q=' + q)
            .then((get) => {
                let $ = cheerio.load(get.data)
                let character = []
                $('#content > table > tbody > tr').each(function(a, b) {
                    character.push($(b).find('td:nth-child(2) > a').attr('href'))
                })
                axios.get(character[0])
                    .then((res) => {
                        let $$ = cheerio.load(res.data)
                        let voice = []
                        $$('#content > table > tbody > tr > td:nth-child(2) > table').each(function(a, b) {
                            voice.push({
                                name: $$(b).find('td:nth-child(2) > a').text(),
                                origin: $$(b).find('td:nth-child(2) > div > small').text(),
                                detail: $$(b).find('td:nth-child(2) > a').attr('href'),
                                image: $$(b).find('td:nth-child(1) > div > a > img').attr('data-src') || $$(b).find('td:nth-child(1) > div > a > img').attr('src')
                            })
                        })
                        let animeography = []
                        $$('#content > table > tbody > tr > td.borderClass > table:nth-child(6) > tbody > tr').each(function(a, b) {
                            animeography.push({
                                name: $$(b).find('td:nth-child(2) > a').text(),
                                status: $$(b).find('td:nth-child(2) > div > small').text(),
                                detail: $$(b).find('td:nth-child(2) > a').attr('href'),
                                image: $$(b).find('td:nth-child(1) > div > a > img').attr('data-src') || $$(b).find('td:nth-child(1) > div > a > img').attr('src')
                            })
                        })
                        let mangaography = []
                        $$('#content > table > tbody > tr > td.borderClass > table:nth-child(9) > tbody > tr').each(function(a, b) {
                            mangaography.push({
                                name: $$(b).find('td:nth-child(2) > a').text(),
                                status: $$(b).find('td:nth-child(2) > div > small').text(),
                                detail: $$(b).find('td:nth-child(2) > a').attr('href'),
                                image: $$(b).find('td:nth-child(1) > div > a > img').attr('data-src') || $$(b).find('td:nth-child(1) > div > a > img').attr('src')
                            })
                        })
                        let hasil = {
                            name: $$('#contentWrapper > div:nth-child(1) > div > div.h1-title > h1').text(),
                            image: $$('#content > table > tbody > tr > td.borderClass > div:nth-child(1) > a > img').attr('data-src') || $$('#content > table > tbody > tr > td.borderClass > div:nth-child(1) > a > img').attr('src'),
                            detail: $$('#content > table > tbody > tr > td:nth-child(2)').text().split('Characters')[1].split('Voice Actors')[0].trim(),
                            voice_actor: voice,
                            animeography,
                            mangaography
                        }
                        resolve(hasil)
                    })
            })
    })
}
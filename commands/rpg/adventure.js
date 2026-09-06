import moment from 'moment-timezone'
import {
    prepareWAMessageMedia
} from 'baileys'

const cooldown = 300000
const MAX_RETRY = 5

let ct = ['AF', 'AX', 'AL', 'DZ', 'AS', 'AD', 'AO', 'AI', 'AQ', 'AG', 'AR', 'AM', 'AW', 'AU', 'AT', 'AZ', 'BS', 'BH', 'BD', 'BB', 'BY', 'BE', 'BZ', 'BJ', 'BM', 'BT', 'BO', 'BQ', 'BA', 'BW', 'BV', 'BR', 'IO', 'BN', 'BG', 'BF', 'BI', 'KH', 'CM', 'CA', 'CV', 'KY', 'CF', 'TD', 'CL', 'CN', 'CX', 'CC', 'CO', 'KM', 'CG', 'CD', 'CK', 'CR', 'CI', 'HR', 'CU', 'CW', 'CY', 'CZ', 'DK', 'DJ', 'DM', 'DO', 'EC', 'EG', 'SV', 'GQ', 'ER', 'EE', 'ET', 'FK', 'FO', 'FJ', 'FI', 'FR', 'GF', 'PF', 'TF', 'GA', 'GM', 'GE', 'DE', 'GH', 'GI', 'GR', 'GL', 'GD', 'GP', 'GU', 'GT', 'GG', 'GN', 'GW', 'GY', 'HT', 'HM', 'VA', 'HN', 'HK', 'HU', 'IS', 'IN', 'ID', 'IR', 'IQ', 'IE', 'IM', 'IL', 'IT', 'JM', 'JP', 'JE', 'JO', 'KZ', 'KE', 'KI', 'KP', 'KR', 'XK', 'KW', 'KG', 'LA', 'LV', 'LB', 'LS', 'LR', 'LY', 'LI', 'LT', 'LU', 'MO', 'MK', 'MG', 'MW', 'MY', 'MV', 'ML', 'MT', 'MH', 'MQ', 'MR', 'MU', 'YT', 'MX', 'FM', 'MD', 'MC', 'MN', 'ME', 'MS', 'MA', 'MZ', 'MM', 'NA', 'NR', 'NP', 'NL', 'AN', 'NC', 'NZ', 'NI', 'NE', 'NG', 'NU', 'NF', 'MP', 'NO', 'OM', 'PK', 'PW', 'PS', 'PA', 'PG', 'PY', 'PE', 'PH', 'PN', 'PL', 'PT', 'PR', 'QA', 'RS', 'RE', 'RO', 'RU', 'RW', 'BL', 'SH', 'KN', 'LC', 'MF', 'PM', 'VC', 'WS', 'SM', 'ST', 'SA', 'SN', 'CS', 'SC', 'SL', 'SG', 'SX', 'SK', 'SI', 'SB', 'SO', 'ZA', 'GS', 'SS', 'ES', 'LK', 'SD', 'SR', 'SJ', 'SZ', 'SE', 'CH', 'SY', 'TW', 'TJ', 'TZ', 'TH', 'TL', 'TG', 'TK', 'TO', 'TT', 'TN', 'TR', 'XT', 'TM', 'TC', 'TV', 'UG', 'UA', 'AE', 'GB', 'US', 'UM', 'UY', 'UZ', 'VU', 'VE', 'VN', 'VG', 'VI', 'WF', 'EH', 'YE', 'ZM', 'ZW']

function msToTime(ms) {
    let h = Math.floor(ms / 3600000)
    let m = Math.floor(ms / 60000) % 60
    let s = Math.floor(ms / 1000) % 60
    return `${h}h ${m}m ${s}s`
}

async function fetchCountry() {
    const code = ct.getRandom()
    const res = await fetch(`https://api.worldbank.org/v2/country/${code}?format=json`)
    if (!res.ok) throw new Error(`HTTP ${res.status} for country ${code}`)
    const json = await res.json()
    if (!Array.isArray(json) || !json[1]?.[0]?.name) throw new Error(`Invalid API response for ${code}: ${JSON.stringify(json).slice(0, 100)}`)
    return json
}

let handler = async (m, {
    conn,
    usedPrefix
}) => {
    let user = global.db.data.users[m.sender]
    if (!user.lastadventure) user.lastadventure = 0

    let timers = cooldown - (new Date - user.lastadventure)
    if (user.health < 80) return m.reply(`Your health is below 80!\nPlease heal ❤ first to adventure again.`)
    if (new Date - user.lastadventure <= cooldown) return m.reply(`You've already adventured, please wait until cooldown finishes.\n⏱️ ${msToTime(timers)}`)

    let kt = null
    for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
        try {
            kt = await fetchCountry()
            break
        } catch (e) {
            if (attempt === MAX_RETRY) {
                return m.reply(`Gagal fetch data negara setelah ${MAX_RETRY} percobaan.\nCoba lagi nanti!`)
            }
            await new Promise(r => setTimeout(r, 500 * attempt))
        }
    }

    try {
        let country = kt[1][0]
        let rewards = reward(user)

        const mapUrl = `https://static-maps.yandex.ru/1.x/?lang=id-ID&ll=${country.longitude},${country.latitude}&z=12&l=map&size=600,300`

        let text = `🔖 Adventure to ${country.name}\n❏––––––『\n┊☃︎  ID: ${country.id}\n┊☃︎  City: ${country.capitalCity}\n┊☃︎  Longitude: ${country.longitude}\n┊☃︎  Latitude: ${country.latitude}\n┗━═┅═━––––––๑\nAdventure finish (. ❛ ᴗ ❛.)\n`

        for (const lost in rewards.lost) {
            const pool = rewards.lost[lost]
            const total = Array.isArray(pool) ? pool.getRandom() : pool
            user[lost] -= total * 1
            if (total) text += `\n${global.rpg.emoticon(lost)}${lost}: -${toRupiah(total)}`
        }

        text += '\n\n🔖 Adventure reward received:'
        for (const rewardItem in rewards.reward) {
            const pool = rewards.reward[rewardItem]
            const total = Array.isArray(pool) ? pool.getRandom() : pool
            user[rewardItem] += total * 1
            if (total) text += `\n➠ ${global.rpg.emoticon(rewardItem)}${rewardItem}: ${toRupiah(total)}`
        }

        const thumbRes = await fetch(mapUrl)
        const thumbBuf = Buffer.from(await thumbRes.arrayBuffer())

        const {
            imageMessage: image
        } = await prepareWAMessageMedia({
            image: thumbBuf
        }, {
            upload: conn.waUploadToServer,
            mediaTypeOverride: 'thumbnail-link'
        })

        image.width = 1280
        image.height = 720

        await conn.sendMessage(m.chat, {
            text: `${mapUrl}\n\n${text}`,
            linkPreview: {
                'matched-text': mapUrl,
                title: `Adventure to ${country.name}`,
                description: country.capitalCity || '',
                previewType: 0,
                jpegThumbnail: thumbBuf,
                highQualityThumbnail: image,
                linkPreviewMetadata: {
                    linkMediaDuration: 0,
                    socialMediaPostType: 4
                }
            }
        }, {
            quoted: m
        })

        user.lastadventure = new Date * 1

    } catch (e) {
        return m.reply(`Terjadi error!\n\`\`\`${e.message}\`\`\``)
    }
}

handler.help = ['adventure']
handler.tags = ['rpg']
handler.command = /^adv(entur(es?)?)?$/i
handler.register = true
handler.group = true
handler.rpg = true

export default handler

function reward(user = {}) {
    const armorLostMax = Math.max(1, (15 - (user.armor || 0)) * 7)
    const armorLostPool = Array.from({
        length: 5
    }, (_, i) => Math.floor(armorLostMax * (i + 1) / 5))

    return {
        reward: {
            money: [500, 750, 1000, 1027, 1200, 1500, 2000],
            exp: [5000, 7000, 9000, 9251, 10000, 12000],
            trash: [50, 75, 100, 101, 120],
            potion: [1, 1, 2, 2, 3],
            rock: [1, 1, 2, 2, 3],
            wood: [1, 1, 2, 2, 3],
            string: [1, 1, 2, 2, 3],
            common: [91, 5, 34, 56, 12],
            uncommon: [5, 1, 18, 1, 3],
            mythic: [9, 0, 4, 0, 0, 1, 0, 2, 0],
            legendary: [0, 3, 0, 0, 5, 0, 0, 1, 0, 9],
            emerald: [0, 1, 0, 0, 0],
            pet: [0, 1, 0, 0, 0],
            iron: [0, 0, 0, 1, 0, 0],
            gold: [0, 0, 0, 0, 0, 1, 0],
            diamond: [9, 4, 0, 0, 1, 0, 1, 0],
        },
        lost: {
            health: [8, 10, 11, 1],
            armordurability: armorLostPool,
        }
    }
}

const toRupiah = number => parseInt(number).toLocaleString().replace(/,/gi, '.')
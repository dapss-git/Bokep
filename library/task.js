import chalk from "chalk"
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import os from 'os'
import moment from 'moment-timezone'
import QRCode from 'qrcode'
let toRupiah = number => parseInt(number).toLocaleString('id-ID')

function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1)
}

function parseNominal(v) {
    if (!v) return 0
    let val = v.kredit || v.debet || v.jumlah || v.amount || v.nominal || v.nominal_transaksi || v.total || v.credit || v.debit || v.jumlah_pembayaran || 0
    
    if (v.status === 'IN') val = v.kredit || v.jumlah || v.amount || 0
    if (v.status === 'OUT') val = v.debet || v.jumlah || v.amount || 0

    if (typeof val === 'number') return val
    if (typeof val === 'string') {
        const clean = val.replace(/\./g, '').replace(/[^0-9]/g, '')
        return parseInt(clean) || 0
    }
    return 0
}

function formattedDate(ms) {
    return moment(ms).tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm')
}

function getTime() {
    return new Date().toLocaleTimeString('en-US', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    })
}

class OrderKuota {
    static API_URL = 'https://app.orderkuota.com/api/v2'
    static HOST = 'app.orderkuota.com'
    static USER_AGENT = 'okhttp/4.12.0'
    static APP_VERSION_NAME = '26.02.04'
    static APP_VERSION_CODE = '260204'
    static APP_REG_ID = 'e5aCENGrQOWvhQWYnv-uNc:APA91bFj3O_mv5Nf_2SM4Duz4Z8Ug3nBNaHlgodlY92CBuNIA9xmc0Dahev5xxqssPmnTdcie4mlhiG9ZAE1iCe1QbyhxcUyGXlenJxiUaXdfm1rklOEo9k'
    static PHONE_MODEL = 'sdk_gphone64_x86_64'
    static PHONE_UUID = 'e5aCENGrQOWvhQWYnv-uNc'
    static PHONE_ANDROID_VERSION = '13'

    constructor(username = null, authToken = null) {
        this.username = username
        this.authToken = authToken
    }

    buildHeaders() {
        return {
            Host: OrderKuota.HOST,
            'User-Agent': OrderKuota.USER_AGENT,
            'Content-Type': 'application/x-www-form-urlencoded',
            'accept-encoding': 'gzip'
        }
    }

    async request(method, url, body = null) {
        const res = await fetch(url, {
            method,
            headers: this.buildHeaders(),
            body: body ? body.toString() : null
        })

        const ct = res.headers.get('content-type')

        return ct && ct.includes('application/json')
            ? await res.json()
            : await res.text()
    }

    async loginRequest(username, password) {
        const payload = new URLSearchParams({
            username,
            password,
            request_time: Math.floor(Date.now() / 1000),
            app_reg_id: OrderKuota.APP_REG_ID,
            phone_android_version: OrderKuota.PHONE_ANDROID_VERSION,
            app_version_code: OrderKuota.APP_VERSION_CODE,
            phone_uuid: OrderKuota.PHONE_UUID
        })

        return this.request(
            'POST',
            `${OrderKuota.API_URL}/login`,
            payload
        )
    }

    async getAuthToken(username, otp) {
        const payload = new URLSearchParams({
            username,
            password: otp,
            request_time: Math.floor(Date.now() / 1000),
            app_reg_id: OrderKuota.APP_REG_ID,
            phone_android_version: OrderKuota.PHONE_ANDROID_VERSION,
            app_version_code: OrderKuota.APP_VERSION_CODE,
            phone_uuid: OrderKuota.PHONE_UUID
        })

        return this.request(
            'POST',
            `${OrderKuota.API_URL}/login`,
            payload
        )
    }

    async getProfile() {
        const payload = new URLSearchParams({
            request_time: Math.floor(Date.now() / 1000),
            app_reg_id: OrderKuota.APP_REG_ID,
            phone_android_version: OrderKuota.PHONE_ANDROID_VERSION,
            app_version_code: OrderKuota.APP_VERSION_CODE,
            phone_uuid: OrderKuota.PHONE_UUID,
            auth_username: this.username,
            auth_token: this.authToken,
            'requests[0]': 'account',
            app_version_name: OrderKuota.APP_VERSION_NAME,
            ui_mode: 'light',
            phone_model: OrderKuota.PHONE_MODEL
        })

        return this.request(
            'POST',
            `${OrderKuota.API_URL}/get`,
            payload
        )
    }

    async generateQr(amount = '') {
        const payload = new URLSearchParams({
            request_time: Math.floor(Date.now() / 1000),
            app_reg_id: OrderKuota.APP_REG_ID,
            phone_android_version: OrderKuota.PHONE_ANDROID_VERSION,
            app_version_code: OrderKuota.APP_VERSION_CODE,
            phone_uuid: OrderKuota.PHONE_UUID,
            auth_username: this.username,
            auth_token: this.authToken,
            'requests[qris_merchant_terms][jumlah]': amount,
            'requests[0]': 'qris_merchant_terms',
            app_version_name: OrderKuota.APP_VERSION_NAME,
            ui_mode: 'light',
            phone_model: OrderKuota.PHONE_MODEL
        })

        return this.request(
            'POST',
            `${OrderKuota.API_URL}/get`,
            payload
        )
    }

    async getTransactionQris(type = '', userId = null) {
        if (!userId && this.authToken) {
            userId = this.authToken.split(':')[0]
        }

        const payload = new URLSearchParams({
            request_time: Math.floor(Date.now() / 1000),
            app_reg_id: OrderKuota.APP_REG_ID,
            phone_android_version: OrderKuota.PHONE_ANDROID_VERSION,
            app_version_code: OrderKuota.APP_VERSION_CODE,
            phone_uuid: OrderKuota.PHONE_UUID,
            auth_username: this.username,
            auth_token: this.authToken,
            'requests[qris_history][jumlah]': '',
            'requests[qris_history][jenis]': type,
            'requests[qris_history][page]': '1',
            'requests[0]': 'account',
            app_version_name: OrderKuota.APP_VERSION_NAME,
            ui_mode: 'light',
            phone_model: OrderKuota.PHONE_MODEL
        })

        const endpoint = userId
            ? `${OrderKuota.API_URL}/qris/mutasi/${userId}`
            : `${OrderKuota.API_URL}/get`

        return this.request(
            'POST',
            endpoint,
            payload
        )
    }

    async withdrawalQris(amount = '') {
        const payload = new URLSearchParams({
            request_time: Math.floor(Date.now() / 1000),
            app_reg_id: OrderKuota.APP_REG_ID,
            phone_android_version: OrderKuota.PHONE_ANDROID_VERSION,
            app_version_code: OrderKuota.APP_VERSION_CODE,
            phone_uuid: OrderKuota.PHONE_UUID,
            auth_username: this.username,
            auth_token: this.authToken,
            'requests[qris_withdraw][amount]': amount,
            'requests[0]': 'account',
            app_version_name: OrderKuota.APP_VERSION_NAME,
            ui_mode: 'light',
            phone_model: OrderKuota.PHONE_MODEL
        })

        return this.request(
            'POST',
            `${OrderKuota.API_URL}/get`,
            payload
        )
    }
}


let fdoc = {
    key: {
        remoteJid: 'status@broadcast',
        participant: '0@s.whatsapp.net'
    },
    message: {
        documentMessage: {
            title: '𝙳 𝙰 𝚃 𝙰 𝙱 𝙰 𝚂 𝙴'
        }
    }
}

async function resetCommand() {
    let user = global.db.data.users || {}
    let chat = global.db.data.chats || {}
    let dataUser = Object.keys(user).filter(number => user[number]?.command > 0)
    let dataChat = Object.keys(chat).filter(v => v.endsWith("@g.us"))
    for (let number of dataUser) if (user[number]) user[number].command = 0
    for (let number of dataChat) {
        let u = chat[number]?.member || {}
        let data = Object.keys(u).filter(v => u[v]?.chat > 0)
        for (let member of data) if (u[member]) u[member].command = 0
    }
}

async function resetChat() {
    let user = global.db.data.users || {}
    let chat = global.db.data.chats || {}
    let dataUser = Object.keys(user).filter(number => user[number]?.chat > 0)
    let dataChat = Object.keys(chat).filter(v => v.endsWith("@g.us"))
    for (let number of dataUser) if (user[number]) user[number].chat = 0
    for (let number of dataChat) {
        let u = chat[number]?.member || {}
        let data = Object.keys(u).filter(v => u[v]?.chat > 0)
        for (let member of data) if (u[member]) u[member].chat = 0
    }
}

async function resetLimit() {
    let user = global.db.data.users
    let data = Object.keys(user).filter(number => user[number].limit < 10)
    for (let number of data) {
        if (user[number].limit < 50) user[number].limit = 50
    }
}

async function resetCryptoPrice() {
    let invest = global.db.data.bots.invest.item
    for (let name of Object.keys(invest)) invest[name].hargaBefore = invest[name].harga
}

async function resetSahamPrice() {
    let saham = global.db.data.bots.saham.item
    for (let name of Object.keys(saham)) saham[name].hargaBefore = saham[name].harga
}

async function resetVolumeSaham() {
    let bot = global.db.data.bots
    for (let v of Object.keys(bot.saham.item)) {
        bot.saham.item[v].volumeBuy = 0
        bot.saham.item[v].volumeSell = 0
    }
}

async function resetVolumeCrypto() {
    let bot = global.db.data.bots
    for (let v of Object.keys(bot.invest.item)) {
        bot.invest.item[v].volumeBuy = 0
        bot.invest.item[v].volumeSell = 0
    }
}

async function Backup(conn) {
    if (!conn || !conn.user) {
        console.error("[TASK] Backup error: conn atau conn.user tidak tersedia");
        return false;
    }

    const botJidKey = conn.user.jid || conn.user.id;
    if (!botJidKey) {
        console.error("[TASK] Backup error: bot JID tidak tersedia");
        return false;
    }

    let setting = global.db.data.settings[botJidKey];
    if (!setting?.backup) return false;

    let d = new Date();
    let date = d.toLocaleDateString('id', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    let database = fs.readFileSync('./database.db');
    const developers = global.owner.filter(([number, _, developer]) => number && developer);
    if (developers.length === 0) return false;

    for (let [jid] of developers) {
        let user = jid + '@s.whatsapp.net';

        await conn.sendMessage(user, {
            text: `*🗓️ Backup Database*\n${date}`
        });

        await conn.sendMessage(user, {
            document: database,
            mimetype: 'application/x-sqlite3',
            fileName: 'database.db'
        });
    }
    return true;
}

function clearMemory(conn) {
    if (conn.spam) conn.spam = {}
    if (conn.khodam) conn.khodam = {}
}

function clearTmp() {
    let __dirname = path.dirname(new URL(import.meta.url).pathname)
    let tmp = [os.tmpdir(), path.join(__dirname, '../tmp')]
    let filenames = []
    tmp.forEach(dirname => {
        try {
            fs.readdirSync(dirname).forEach(file => filenames.push(path.join(dirname, file)))
        } catch (err) {
            console.error(`Error reading directory ${dirname}:`, err)
        }
    })
    filenames.forEach(file => {
        try {
            let stats = fs.statSync(file)
            if (stats.isFile() && (Date.now() - stats.mtimeMs >= 1000 * 60 * 5)) fs.unlinkSync(file)
        } catch (err) {
            console.error(`Error processing file ${file}:`, err)
        }
    })
}

async function checkGempa(conn) {
    let chat = global.db.data.chats
    let bot = global.db.data.bots
    let apiResponse = await axios.get('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json')
    let gempa = apiResponse.data.Infogempa.gempa
    if (gempa.DateTime !== bot.gempaDateTime) {
        bot.gempaDateTime = gempa.DateTime
        let groups = Object.entries(conn.chats).filter(([jid, chat]) => jid.endsWith('@g.us') && chat.isChats && !chat.metadata?.read_only && !chat.metadata?.announce && !chat.isCommunity && !chat.isCommunityAnnounce && !chat?.metadata?.isCommunity && !chat?.metadata?.isCommunityAnnounce).map(v => v[0])
        for (let number of groups) {
            if (!chat[number]) chat[number] = {}
            if (chat[number].notifgempa && chat[number].gempaDateTime !== gempa.DateTime) {
                chat[number].gempaDateTime = gempa.DateTime
                let caption = `*BMKG Notif Gempa!*\n\nKoordinat: ${gempa.Coordinates}\nMagnitude: ${gempa.Magnitude}\nKedalaman: ${gempa.Kedalaman}\n\n_Wilayah: ${gempa.Wilayah}, Potensi: ${gempa.Potensi}_\n\n_Dihimbau untuk warga yang berada di wilayah *${gempa.Dirasakan}* untuk selalu berhati-hati!_`
                await conn.sendFile(number, 'https://data.bmkg.go.id/DataMKG/TEWS/' + gempa.Shakemap, 'map.jpg', caption, false)
            }
        }
    }
}

async function checkSewa() {
}

async function checkPremium(conn) {
    if (!conn) return
    let user = global.db.data.users
    let data = Object.keys(global.db.data.users).filter(v => user[v].premiumTime > 0 && new Date() * 1 - user[v].premiumTime > 0)
    for (let number of data) {
        await conn.reply(number, `Halo ${global.db.data.users[number].registered ? global.db.data.users[number].name : conn.getName(number)} \nWaktu premium kamu sudah habis, jika ingin perpanjang silahkan chat nomor owner dibawah ya!`, null)
        await conn.sendContact(number, global.config.owner, null)
        user[number].premiumTime = 0
        if (typeof user[number].premium === 'object') {
            user[number].premium.status = false
            user[number].premium.expired = 0
        } else {
            user[number].premium = { status: false, expired: 0 }
        }
    }
}

async function updateSaham() {
    let bot = global.db.data.bots
    let persen = [0.01, 0.001]
    for (let [name, value] of Object.entries(bot.saham.item)) {
        let volNaik = value.rise.filter(v => v === 'naik').length
        let volTurun = value.rise.filter(v => v === 'turun').length
        if ((value.volumeBuy / 100) - (value.volumeSell / 100) > 1000 && volNaik === 1) {
            value.rise.push('naik')
        } else if ((value.volumeSell / 100) - (value.volumeBuy / 100) > 1000 && volTurun === 1) {
            value.rise.push('turun')
        } else if ((value.volumeBuy / 100) - (value.volumeSell / 100) < 1000 && volNaik === 2) {
            let i = value.rise.indexOf('naik')
            if (i !== -1) value.rise.splice(i, 1)
        } else if ((value.volumeSell / 100) - (value.volumeBuy / 100) < 1000 && volTurun === 2) {
            let i = value.rise.indexOf('turun')
            if (i !== -1) value.rise.splice(i, 1)
        }
        let isPersen = persen[Math.floor(Math.random() * persen.length)]
        let onePercent = parseInt((value.harga * isPersen).toFixed(0))
        let isRise = value.rise[Math.floor(Math.random() * value.rise.length)]
        if (isRise === 'naik') value.harga += onePercent
        else if (isRise === 'turun') value.harga -= onePercent
    }
}

async function updateCrypto() {
    let bot = global.db.data.bots
    let persen = [0.01, 0.02]
    for (let [name, value] of Object.entries(bot.invest.item)) {
        let volNaik = value.rise.filter(v => v === 'naik').length
        let volTurun = value.rise.filter(v => v === 'turun').length
        if (value.volumeBuy - value.volumeSell > 10000 && volNaik === 1) {
            value.rise.push('naik')
        } else if (value.volumeSell - value.volumeBuy > 10000 && volTurun === 1) {
            value.rise.push('turun')
        } else if (value.volumeBuy - value.volumeSell < 10000 && volNaik === 2) {
            let i = value.rise.indexOf('naik')
            if (i !== -1) value.rise.splice(i, 1)
        } else if (value.volumeSell - value.volumeBuy < 10000 && volTurun === 2) {
            let i = value.rise.indexOf('turun')
            if (i !== -1) value.rise.splice(i, 1)
        }
        let isPersen = persen[Math.floor(Math.random() * persen.length)]
        let onePercent = parseInt((value.harga * isPersen).toFixed(0))
        let isRise = value.rise[Math.floor(Math.random() * value.rise.length)]
        if (isRise === 'naik') value.harga += onePercent
        else if (isRise === 'turun') value.harga -= onePercent
    }
}

async function checkSholat(conn) {
    let bot = global.db.data.bots
    let chat = global.db.data.chats

    if (!bot || !bot.jadwalsholat || !bot.jadwalsholat.list) {
        return
    }

    let groups = Object.entries(conn.chats).filter(([jid, chat]) => jid.endsWith('@g.us') && chat.isChats && !chat.metadata?.read_only && !chat.metadata?.announce && !chat.isCommunity && !chat.isCommunityAnnounce && !chat?.metadata?.isCommunity && !chat?.metadata?.isCommunityAnnounce).map(v => v[0])
    let jadwalsholat = Object.keys(bot.jadwalsholat.list)
    for (let i = 0; i < jadwalsholat.length; i++) {
        let currentPrayer = jadwalsholat[i]
        let prayerTime = bot.jadwalsholat.list[currentPrayer]
        let now = getTime()
        if (prayerTime === now && bot.jadwalsholat.now !== currentPrayer) {
            bot.jadwalsholat.now = currentPrayer
            let audioUrl = 'https://api.deline.web.id/Oz2Z81egI9.mp3'
            for (let chatId of groups) {
                if (chat[chatId].notifazan && chat[chatId]?.sholatNow !== currentPrayer) {
                    chat[chatId].sholatNow = currentPrayer
                    await conn.sendFile(chatId, audioUrl, '', '', null, null, {
                        contextInfo: {
                            externalAdReply: {
                                showAdAttribution: false,
                                mediaType: 1,
                                title: `Azan ${currentPrayer} Sudah Berkumandang`,
                                body: 'Untuk wilayah Jakarta dan sekitarnya.',
                                thumbnail: (await conn.getFile('https://api.deline.web.id/MIWghgcVXU.jpg')).data,
                                renderLargerThumbnail: true,
                                mediaUrl: '',
                                sourceUrl: ''
                            }
                        }
                    })
                }
            }
        }
    }
}

function parseMutationTime(raw) {
    if (!raw) return 0
    // OrderKuota uses DD/MM/YYYY HH:mm:ss in WIB (GMT+7)
    try {
        const m = moment.tz(raw, 'DD/MM/YYYY HH:mm:ss', 'Asia/Jakarta')
        if (m.isValid()) return m.valueOf()
    } catch (e) {}

    const m2 = moment(raw)
    if (m2.isValid()) return m2.valueOf()
    
    return 0
}

async function transactionHandler(conn) {
    if (!conn.quickPurchase) conn.quickPurchase = {}
    if (!conn.transaction) conn.transaction = {}

    for (let key of Object.keys(conn.quickPurchase)) {
        let user = global.db.data.users[key]
        if (!user) continue

        let {
            chat, itemID, number, harga, produk, image,
            type = 'purchase', customer_name, linkGroup, target
        } = conn.quickPurchase[key]

        try {
            console.log(chalk.yellow(`[PAYMENT] Creating payment for ${key}: ${produk} - Rp.${toRupiah(harga)}`))

            // Jika donasi, nominal pas sesuai permintaan. Jika lainnya (deposit/topup), tambahkan kode unik 20-99.
            const uniqueAmount = type === 'donasi' ? Number(harga) : Number(harga) + Math.floor(Math.random() * 80) + 20
            const result = await generateQris(uniqueAmount)

            const qrString = result?.qris_dynamic || result?.qris || result?.qris_string ||
                             result?.qris_merchant_terms?.qris || result?.qris_merchant_terms?.qr_string ||
                             result?.qris_merchant_terms?.results?.qris_data

            if (!qrString) throw new Error('QRIS tidak ditemukan')

            const qrBuffer = await QRCode.toBuffer(qrString)
            const trxId = `${uniqueAmount}_${Date.now()}`

            const expired = setTimeout(async () => {
                console.log(chalk.yellow(`[PAYMENT] Payment expired: ${trxId}`))
                if (conn.transaction[key] && conn.transaction[key].trxId === trxId) {
                    let trx = conn.transaction[key]
                    if (trx.msg && trx.msg.key) {
                        await conn.sendMessage(chat, { delete: trx.msg.key }).catch(() => {})
                    }
                    await conn.sendMessage(chat, {
                        text: `⏰ *TRANSAKSI KADALUARSA*\n\nID: ${trxId}\nProduk: ${produk}\n\nWaktu pembayaran telah habis (5 menit). Silakan buat pesanan baru jika ingin melanjutkan.`
                    }).catch(() => {})
                    delete conn.transaction[key]
                }
            }, 300000)

            let caption = `*✅ PEMBAYARAN DIBUAT*\n\n` +
                `📦 Produk: ${produk}\n` +
                `🆔 ID Pembayaran: ${trxId}\n` +
                `💰 Harga: Rp.${toRupiah(uniqueAmount)}\n\n` +
                `📱 Scan QR Code di atas\n` +
                `⏳ Expired dalam 5 menit\n\n` +
                `*PENTING:* Bayar sesuai nominal agar terdeteksi otomatis.`

            const qrisMsg = await conn.sendMessage(chat, {
                image: qrBuffer,
                caption,
                footer: global.footer,
                buttons: [
                    { buttonId: `.cekstatus`, buttonText: { displayText: '🔄 Cek Status' }, type: 1 },
                    { buttonId: `.batal`, buttonText: { displayText: '❌ Batalkan' }, type: 1 }
                ]
            })

            conn.transaction[key] = {
                chat, trxId, amount: uniqueAmount, itemID, number, harga, produk,
                image, type, linkGroup, target, time: moment().tz('Asia/Jakarta').valueOf(), expired,
                msg: qrisMsg, // Simpan pesan QRIS untuk dihapus nanti
                initial_balance: result.initial_balance || 0
            }

            console.log(chalk.green(`[PAYMENT] Payment created: ${trxId} - Rp.${toRupiah(uniqueAmount)} - Bal: ${result.initial_balance}`))
            delete conn.quickPurchase[key]

        } catch (e) {
            console.error(chalk.red(`[PAYMENT] transactionHandler create error (${key}):`), e.message)
            await conn.sendMessage(chat, { text: `❌ Terjadi kesalahan saat membuat pembayaran. Silakan coba lagi.` }).catch(() => {})
            delete conn.quickPurchase[key]
        }
    }

    const activeTrx = Object.keys(conn.transaction)
    if (activeTrx.length === 0) return

    try {
        const ok = new OrderKuota(global.orderkuota.username, global.orderkuota.token)
        const profile = await ok.getProfile()
        const account = profile?.account?.results || profile?.account || profile?.results?.[0]?.account || profile?.results || profile || {}
        const currentQrisBalance = Number(account.balance_qris ?? account.saldo_qris ?? account.qris_balance ?? 0)
        
        for (let v of activeTrx) {
            let user = global.db.data.users[v]
            if (!user) continue

            let trx = conn.transaction[v]
            let { chat, trxId, amount, itemID, harga, produk, image, type, linkGroup, target, expired, msg, time, initial_balance } = trx

            // Cek via Kenaikan Saldo (Fast Track) - Berikan toleransi MDR 2%
            let confirmed = false
            const balanceIncrease = currentQrisBalance - initial_balance
            const minExpectedIncrease = Number(amount) * 0.98 // Toleransi 2% untuk MDR fee
            
            if (initial_balance !== undefined && balanceIncrease >= minExpectedIncrease) {
                confirmed = true
            }

            if (!confirmed) continue

            // Hapus pesan QRIS jika ada
            if (msg && msg.key) {
                await conn.sendMessage(chat, { delete: msg.key }).catch(() => {})
            }

            console.log(chalk.green(`[PAYMENT] Payment confirmed: ${trxId} (Balance Increase)`))
            let name = user.registered ? user.name : await conn.getName(v)

            if (type === 'donasi') {
                let caption = `*✅ DONASI BERHASIL*\n\n` +
                    `ID: ${trxId}\n` +
                    `Nominal: Rp.${toRupiah(harga)}\n` +
                    `Waktu: ${formattedDate(Date.now())}\n\n` +
                    `Terima kasih atas donasi Anda! Dukungan Anda sangat berarti bagi pengembangan bot ini.`

                await conn.adReply(chat, caption, `Halo ${name}`, global.wm)
                user.historyTrx ??= []
                user.historyTrx.push({ trxId, nominal: harga, type: 'Donasi', time: Date.now() })

            } else if (type === 'deposit') {
                let caption = `*✅ DEPOSIT BERHASIL*\n\n` +
                    `ID: ${trxId}\n` +
                    `Nominal: Rp.${toRupiah(harga)}\n` +
                    `Deposit: +Rp.${toRupiah(harga)}\n` +
                    `Saldo Sekarang: Rp.${toRupiah((user.saldo || 0) + harga)}\n` +
                    `Waktu: ${formattedDate(Date.now())}`

                await conn.adReply(chat, caption, `Halo ${name}`, global.wm)
                user.saldo = (user.saldo || 0) + harga
                user.historyTrx ??= []
                user.historyTrx.push({ trxId, nominal: harga, type: 'Deposit', time: Date.now() })

            } else if (/prem/i.test(itemID)) {
                let hari = itemID.replace('prem', '')
                hari = /permanen/i.test(hari) ? 9999 : parseInt(hari)
                let now = Date.now()
                let durasi = 86400000 * hari
                let expiredTime = user.premiumTime && user.premiumTime > now ? user.premiumTime + durasi : now + durasi

                user.premiumTime = expiredTime
                user.premium = { status: true, expired: expiredTime }
                let caption = `*✅ PEMBELIAN PREMIUM BERHASIL*\n\n` +
                    `ID: ${trxId}\n` +
                    `Pembelian: Premium ${hari === 9999 ? 'Permanent' : `${hari} Hari`}\n` +
                    `Harga: Rp.${toRupiah(harga)}\n` +
                    `Expired: ${new Date(expiredTime).toLocaleString('id-ID')}\n` +
                    `Status: Aktif ✓`

                await conn.adReply(chat, caption, `Halo ${name}`, global.wm)
                user.historyTrx ??= []
                user.historyTrx.push({ refId: trxId, nominal: harga, type: 'Premium', time: Date.now() })

            } else if (/sewa/i.test(itemID)) {
                let isPremiumGroup = /sewaprem/i.test(itemID)
                let hari = parseInt(itemID.replace(isPremiumGroup ? 'sewaprem' : 'sewa', '')) || 0
                let joinSuccess = false
                
                let groupId = null
                if (linkGroup && linkGroup.includes('internal-renew-')) {
                    groupId = linkGroup.split('internal-renew-')[1] + '@g.us'
                }

                if (linkGroup && !groupId) {
                    try {
                        let codeMatch = linkGroup.match(/chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i)
                        if (codeMatch && codeMatch[1]) {
                            let code = codeMatch[1]
                            try {
                                let inviteInfo = await conn.groupGetInviteInfo(code)
                                groupId = inviteInfo?.id
                            } catch (e) {}

                            try {
                                let res = await conn.groupAcceptInvite(code)
                                if (!groupId) groupId = typeof res === 'object' ? (res?.gid || res?.id || res) : res
                            } catch (e) {
                                console.error('[SEWA] groupAcceptInvite maybe already joined:', e.message)
                            }
                        }
                    } catch (e) { console.error('[SEWA] Error joining group:', e) }
                }

                if (groupId) {
                    groupId = groupId.toString()
                    if (!groupId.endsWith('@g.us')) groupId += '@g.us'
                    joinSuccess = true
                    let groupChat = global.db.data.chats[groupId] || (global.db.data.chats[groupId] = { isChats: true })
                    groupChat.id = groupId
                    groupChat.sewa = groupChat.sewa || { status: false, expired: 0, warned: false }
                    let now = Date.now()
                    let durasi = 86400000 * hari
                    groupChat.sewa.status = true
                    groupChat.sewa.expired = (groupChat.sewa.expired && groupChat.sewa.expired > now) ? groupChat.sewa.expired + durasi : now + durasi
                    groupChat.sewa.warned = false

                    if (isPremiumGroup) {
                        groupChat.premium = groupChat.premium || { status: false, expired: 0 }
                        groupChat.premium.status = true
                        groupChat.premium.expired = (groupChat.premium.expired && groupChat.premium.expired > now) ? groupChat.premium.expired + durasi : now + durasi
                    }

                    if (global.db && global.db.save) await global.db.save()
                    await conn.sendMessage(groupId, { text: `✅ Berhasil ${linkGroup.includes('internal-renew-') ? 'memperpanjang' : 'join grup melalui'} layanan sewa bot.\nSewa di grup ini aktif selama ${hari} hari.${isPremiumGroup ? '\n\n✨ Grup ini telah ditingkatkan ke status Premium!' : ''}` }).catch(()=>{})
                }

                let caption = `*✅ PEMBELIAN SEWA BOT BERHASIL*\n\n` +
                    `ID: ${trxId}\n` +
                    `Pembelian: ${linkGroup.includes('internal-renew-') ? 'Renew ' : ''}Sewa ${isPremiumGroup ? '+ Premium Grup ' : 'Bot '}${hari} Hari\n` +
                    `Harga: Rp.${toRupiah(harga)}\n` +
                    `Status Pembayaran: Berhasil ✓\n` +
                    `Status Update Grup: ${joinSuccess ? 'Berhasil ✓' : 'Gagal'}\n\n` +
                    (joinSuccess ? `Masa aktif grup telah diperbarui.` : `Silakan hubungi owner untuk bantuan manual.`)

                await conn.adReply(chat, caption, `Halo ${name}`, global.wm)
                user.historyTrx ??= []
                user.historyTrx.push({ refId: trxId, nominal: harga, type: `Sewa ${isPremiumGroup ? '+ Premium Grup ' : 'Bot '}${hari} Hari`, time: Date.now() })

            } else if (type.startsWith('topup_')) {
                const walletName = type.split('_')[1].toUpperCase()
                let resultText = 'Gagal'
                try {
                    const isBebasNominal = itemID.toUpperCase().includes('BBS') || produk.toLowerCase().includes('bebas nominal')
                    const url = new URL('https://h2h.okeconnect.com/trx')
                    url.searchParams.append('memberID', global.orderkuota.memberID)
                    url.searchParams.append('pin', global.orderkuota.pin)
                    url.searchParams.append('password', global.orderkuota.password)
                    url.searchParams.append('product', itemID)
                    url.searchParams.append('dest', target)
                    url.searchParams.append('refID', trxId)
                    if (isBebasNominal) url.searchParams.append('qty', harga)

                    const res = await fetch(url.toString())
                    resultText = await res.text()

                    if (resultText.toLowerCase().includes('proses') || resultText.toLowerCase().includes('sukses') || resultText.includes('Saldo')) {
                        let caption = `*✅ PEMBELIAN TOPUP ${walletName} BERHASIL*\n\n` +
                            `ID: ${trxId}\n` +
                            `Produk: ${produk}\n` +
                            `Nomor Tujuan: ${target}\n` +
                            `Harga: Rp.${toRupiah(harga)}\n` +
                            `Status: Berhasil / Diproses ✓\n\n` +
                            `_Respon Server:_\n${resultText.trim()}`
                        await conn.adReply(chat, caption, `Halo ${name}`, global.wm)
                    } else {
                        await conn.sendMessage(chat, { text: `❌ Topup Gagal.\n\nServer Response: ${resultText}` })
                    }
                } catch (e) { console.error(`[TOPUP ${walletName}] Error:`, e) }

                user.historyTrx ??= []
                user.historyTrx.push({ refId: trxId, nominal: harga, type: `Topup ${walletName}`, time: Date.now() })

            } else {
                let caption = `*✅ PEMBELIAN BERHASIL*\n\nID: ${trxId}\nProduk: ${produk}\nHarga: Rp.${toRupiah(harga)}\nStatus: Berhasil ✓`
                await conn.adReply(chat, caption, `Halo ${name}`, global.wm, image)
                user.historyTrx ??= []
                user.historyTrx.push({ refId: trxId, nominal: harga, type: produk, time: Date.now() })
            }

            clearTimeout(expired)
            delete conn.transaction[v]
        }
    } catch (e) {
        console.error(chalk.red(`[PAYMENT] transactionHandler check error:`), e.message)
    }
}


async function checkOrderKuotaBalance() {
    try {
        const ok = new OrderKuota(
            global.orderkuota.username,
            global.orderkuota.token
        )

        const res = await ok.request(
            'POST',
            `${OrderKuota.API_URL}/get`,
            new URLSearchParams({
                request_time: Date.now(),
                app_reg_id: OrderKuota.APP_REG_ID,
                phone_android_version: OrderKuota.PHONE_ANDROID_VERSION,
                app_version_code: OrderKuota.APP_VERSION_CODE,
                phone_uuid: OrderKuota.PHONE_UUID,
                auth_username: global.orderkuota.username,
                auth_token: global.orderkuota.token,
                'requests[0]': 'account',
                app_version_name: OrderKuota.APP_VERSION_NAME,
                ui_mode: 'light',
                phone_model: OrderKuota.PHONE_MODEL
            })
        )

        const account = res.account || {}

        return {
            username: account.username || global.orderkuota.username,
            balance_available: Number(account.balance || account.saldo || 0),
            balance_pending: 0,
            raw: account
        }

    } catch (e) {
        console.error('[SALDO] Error checking balance:', e.message)
        return null
    }
}

async function checkPaymentStatus(amount) {
    try {
        const ok = new OrderKuota(
            global.orderkuota.username,
            global.orderkuota.token
        )

        const result = await ok.getTransactionQris()
        const history = result?.qris_history?.results || result?.results || result?.data || []
        const trx = history.find(v => parseNominal(v) === Number(amount))

        if (!trx) {
            return { status: false, paid: false }
        }

        return {
            status: true,
            paid: true,
            id: trx.id || trx.trxid || trx.reference,
            amount: parseNominal(trx),
            date: trx.tanggal || trx.date || trx.created_at || trx.datetime,
            data: trx
        }

    } catch (e) {
        console.error(chalk.red('[PAYMENT] Error checking payment status:'), e.message)
        return null
    }
}

async function getTransactionHistory(limit = 100) {
    try {
        const ok = new OrderKuota(
            global.orderkuota.username,
            global.orderkuota.token
        )

        const result = await ok.getTransactionQris()

        if (!result) {
            console.error(chalk.red('[HISTORY] Failed to get transaction history'))
            return null
        }

        let history = result.qris_history?.results || []

        if (limit) {
            history = history.slice(0, limit)
        }

        return history

    } catch (e) {
        console.error(chalk.red('[HISTORY] Error getting transaction history:'), e.message)
        return null
    }
}

async function autoWithdrawal(conn) {
    try {
        const botJidKey = conn?.user?.jid || conn?.user?.id
        if (!botJidKey) return

        let setting = global.db.data.settings[botJidKey]
        if (!setting?.autowd) return

        const ok = new OrderKuota(global.orderkuota.username, global.orderkuota.token)
        const profile = await ok.getProfile()

        const account = profile?.account || profile?.results?.[0]?.account || {}
        const qrisBalance = Number(account.balance_qris || account.saldo_qris || account.qris_balance || 0)

        if (qrisBalance >= 1000) {
            const amountToWd = Math.floor(qrisBalance / 1000) * 1000
            console.log(chalk.cyan(`[AUTO-WD] Mendeteksi saldo merchant: Rp ${toRupiah(qrisBalance)}. Menarik: Rp ${toRupiah(amountToWd)}`))

            const res = await ok.withdrawalQris(amountToWd)
            const result = typeof res === 'string' ? res : JSON.stringify(res)

            if (result.toLowerCase().includes('sukses') || result.toLowerCase().includes('berhasil') || result.toLowerCase().includes('proses')) {
                console.log(chalk.green(`[AUTO-WD] Penarikan Rp ${toRupiah(amountToWd)} berhasil diproses.`))
            } else {
                console.log(chalk.red(`[AUTO-WD] Penarikan gagal: ${result}`))
            }
        }
    } catch (e) {
        console.error(chalk.red(`[AUTO-WD] Error:`), e.message)
    }
}

async function checkGroupSchedules(conn) {
    if (!global.db?.data?.chats) return
    const chats = global.db.data.chats
    const now = Date.now()
    const jids = Object.keys(chats)
    
    for (const jid of jids) {
        if (!jid.endsWith('@g.us') || jid.includes(' ') || jid.includes('@sessions/')) continue
        const chat = chats[jid]
        if (!chat || !chat.scheduled) continue
        
        if (chat.scheduled.time <= now) {
            const { action, isDaily } = chat.scheduled
            console.log(`[TASK] Executing schedule for ${jid}: ${action} (Target: ${chat.scheduled.time}, Now: ${now}, Daily: ${isDaily})`)
            
            try {
                await conn.groupSettingUpdate(jid, action === 'open' ? 'not_announcement' : 'announcement')
                await conn.sendMessage(jid, {
                    text: `✅ *Group ${action === 'open' ? 'Opened' : 'Closed'}!*\n\nSesuai jadwal${isDaily ? ' (Harian)' : ''}.`
                })
                
                if (isDaily) {
                    // Reschedule for next day (add 24 hours)
                    chat.scheduled.time += 24 * 60 * 60 * 1000
                    console.log(`[TASK] Daily schedule for ${jid} rescheduled for: ${chat.scheduled.time}`)
                } else {
                    delete chat.scheduled
                    console.log(`[TASK] Schedule for ${jid} completed and deleted.`)
                }
            } catch (e) {
                console.error(`[TASK] Group schedule error for ${jid}:`, e)
                // If it's a permission error or similar, we might want to delete it anyway to avoid spamming
                if (e.message?.includes('not-authorized') || e.message?.includes('403')) {
                    delete chat.scheduled
                }
            }
        }
    }
}

async function checkExpirations(conn, db) {
  const now = Date.now()
  const ONE_DAY = 24 * 60 * 60 * 1000
  const users = db.data?.users || {}
  const groups = db.data?.chats || {}
  let needSave = false

  for (const jid in users) {
    const user = users[jid]
    if (user?.premium?.status && user.premium.expired < now) {
      user.premium.status = false
      user.premium.expired = 0
      user.premiumTime = 0
      needSave = true
      console.log(chalk.yellow(`[TASK] Premium user habis: ${jid}`))
      await conn.sendMessage(jid, { text: "Masa premium Anda telah berakhir." }).catch(() => {})
    }
  }

  for (const gid in groups) {
    if (!gid.endsWith('@g.us') || gid.includes(' ') || gid.includes('@sessions/')) continue

    const group = groups[gid]
    group.premium ||= { status: false, expired: 0 }
    group.sewa ||= { status: false, expired: 0, warned: false }

    if (group.premium.status && group.premium.expired > 0 && group.premium.expired < now) {
      group.premium.status = false
      group.premium.expired = 0
      needSave = true
      await conn.sendMessage(gid, { text: "Masa premium grup ini telah berakhir." }).catch(() => {})
      console.log(chalk.yellow(`[TASK] Premium grup habis: ${gid}`))
    }

    if (group.sewa.status && !group.sewa.warned && group.sewa.expired > now && group.sewa.expired - now <= ONE_DAY) {
      group.sewa.warned = true
      needSave = true
      await conn.sendMessage(gid, {
        text: "⚠️ *Peringatan Sewa Grup*\n\nSewa bot akan berakhir dalam *24 jam*.\nSilakan perpanjang agar bot tetap aktif."
      }).catch(() => {})
      console.log(chalk.yellow(`[TASK] Warning H-1 sewa: ${gid}`))
    }

    if (group.sewa.status && group.sewa.expired > 0 && group.sewa.expired < now) {
      const expiredDate = new Date(group.sewa.expired).toLocaleString('id-ID')
      console.log(chalk.red(`[TASK] ⚠️ Detected expired sewa: ${gid} (expired: ${expiredDate})`))

      group.sewa.status = false
      group.sewa.expired = 0
      group.sewa.warned = false
      needSave = true

      await conn.sendMessage(gid, {
        text: "⏰ *Masa sewa bot telah berakhir.*\nBot akan keluar dari grup.\n\nSilakan sewa kembali untuk menggunakan bot."
      }).catch((err) => {
        console.log(chalk.yellow(`[TASK] Tidak bisa kirim pesan ke ${gid}, mungkin bot sudah bukan admin: ${err.message}`))
      })

      console.log(chalk.red(`[TASK] Sewa habis, akan keluar dari grup: ${gid}`))

      setTimeout(async () => {
        try {
          await conn.groupLeave(gid)
          console.log(chalk.green(`[TASK] ✅ Berhasil keluar dari grup: ${gid}`))
        } catch (e) {
          console.error(chalk.red(`[TASK] ❌ Gagal keluar dari grup: ${gid}`), e.message)
        }
      }, 5000)
    }
  }

  if (needSave && db.save) await db.save()
}

let dailyTaskInterval = null
let fastInterval = null
let mediumInterval = null
let _conn = null
let _db = null

export default function setupDailyTasks({ conn, db } = {}) {
  if (!conn || !db) {
    console.error(chalk.red("[TASK] setupDailyTasks dipanggil tanpa conn/db"))
    return
  }

  _conn = conn
  _db = db

  // Cleanup corrupted chat keys from database
  try {
    const chats = _db.data?.chats || {}
    for (const gid in chats) {
      if (gid.includes(' ') || gid.includes('@sessions/')) {
        console.log(chalk.yellow(`[TASK] Cleaning up corrupted chat key: ${gid}`))
        delete chats[gid]
      }
    }
    if (_db.save) _db.save()
  } catch (e) {
    console.error(chalk.red("[TASK] Database cleanup error:"), e.message)
  }

  if (dailyTaskInterval) {
    console.log(chalk.yellow("[TASK] Daily task references updated."))
    return
  }

  const ONE_DAY = 24 * 60 * 60 * 1000

  fastInterval = setInterval(async () => {
    try { await transactionHandler(_conn) } catch (e) { console.error(chalk.red("[TASK] transactionHandler error:"), e.message) }
    try { await checkGempa(_conn) } catch (e) { console.error(chalk.red("[TASK] checkGempa error:"), e.message) }
    try { await checkSholat(_conn) } catch (e) { console.error(chalk.red("[TASK] checkSholat error:"), e.message) }
    try { await checkGroupSchedules(_conn) } catch (e) { console.error(chalk.red("[TASK] checkGroupSchedules error:"), e.message) }
    try { await checkExpirations(_conn, _db) } catch (e) { console.error(chalk.red("[TASK] checkExpirations error:"), e.message) }
    
    // Dynamic interval: if active transactions, check again in 5s
    const activeCount = Object.keys(_conn.transaction || {}).length
    if (activeCount > 0) {
        setTimeout(async () => {
            try { await transactionHandler(_conn) } catch (e) {}
        }, 5000)
        setTimeout(async () => {
            try { await transactionHandler(_conn) } catch (e) {}
        }, 10000)
        setTimeout(async () => {
            try { await transactionHandler(_conn) } catch (e) {}
        }, 15000)
    }
  }, 20 * 1000)

  mediumInterval = setInterval(async () => {
    try { await updateSaham() } catch (e) { console.error(chalk.red("[TASK] updateSaham error:"), e.message) }
    try { await updateCrypto() } catch (e) { console.error(chalk.red("[TASK] updateCrypto error:"), e.message) }
    try { await autoWithdrawal(_conn) } catch (e) { console.error(chalk.red("[TASK] autoWithdrawal error:"), e.message) }
    try { clearMemory(_conn) } catch (e) { console.error(chalk.red("[TASK] clearMemory error:"), e.message) }
    try { clearTmp() } catch (e) { console.error(chalk.red("[TASK] clearTmp error:"), e.message) }
  }, 60 * 1000)

  dailyTaskInterval = setInterval(async () => {
    try {
      const today = new Date().toISOString().split("T")[0]
      const now = Date.now()

      const data = _db.data || {}
      const botJidKey = _conn?.user?.jid || _conn?.user?.id || 'bot'
      const settings = (data.settings ||= {})[botJidKey] ||= {}
      const users = data.users ||= {}
      const groups = data.chats ||= {}

      let needSave = false

      if (settings.lastReset !== today) {
        console.log(chalk.cyan("[TASK] Reset limit harian..."))
        const limit = global.defaultLimit ?? 100
        for (const jid in users) users[jid].limit = limit
        settings.lastReset = today
        needSave = true
        console.log(chalk.green("[TASK] Reset limit selesai"))
      }

      if (settings.lastResetCommand !== today) {
        try {
          await resetCommand()
          await resetChat()
          settings.lastResetCommand = today
          needSave = true
          console.log(chalk.green("[TASK] Reset command & chat selesai"))
        } catch (e) { console.error(chalk.red("[TASK] resetCommand/resetChat error:"), e.message) }
      }

      if (settings.lastResetMarket !== today) {
        try {
          await resetCryptoPrice()
          await resetSahamPrice()
          await resetVolumeSaham()
          await resetVolumeCrypto()
          settings.lastResetMarket = today
          needSave = true
          console.log(chalk.green("[TASK] Reset market (harga & volume) selesai"))
        } catch (e) { console.error(chalk.red("[TASK] resetMarket error:"), e.message) }
      }

      if (settings.lastBackup !== today) {
        try {
          const performed = await Backup(_conn)
          if (performed) {
            settings.lastBackup = today
            needSave = true
            console.log(chalk.green("[TASK] Backup selesai"))
          }
        } catch (e) { console.error(chalk.red("[TASK] Backup error:"), e.message) }
      }

      try { await checkSewa() } catch (e) { console.error(chalk.red("[TASK] checkSewa error:"), e.message) }
      try { await checkPremium(_conn) } catch (e) { console.error(chalk.red("[TASK] checkPremium error:"), e.message) }

      if (needSave) await _db.save()

    } catch (err) {
      console.error(chalk.red("[TASK] Error interval:"), err)
    }
  }, 5 * 60 * 1000)

  console.log(chalk.green("[TASK] Daily task scheduler aktif."))
}

function createDynamicQris(qris, amount) {
    if (!qris) return null
    if (!amount) return qris

    let res = qris.replace('010211', '010212')

    const crcIdx = res.lastIndexOf('6304')
    if (crcIdx !== -1) {
        res = res.substring(0, crcIdx)
    }

    let rebuilt = ''
    let i = 0
    while (i < res.length) {
        if (i + 4 > res.length) { rebuilt += res.substring(i); break }
        const tag = res.substring(i, i + 2)
        const lenStr = res.substring(i + 2, i + 4)
        const len = parseInt(lenStr, 10)
        if (isNaN(len)) { rebuilt += res.substring(i); break }
        const value = res.substring(i + 4, i + 4 + len)
        if (tag !== '54') {
            rebuilt += tag + lenStr + value
        }
        i += 4 + len
    }
    res = rebuilt

    const amountStr = Math.floor(Number(amount)).toString()
    res += '54' + amountStr.length.toString().padStart(2, '0') + amountStr

    res += '6304'
    let crc = 0xFFFF
    for (let c = 0; c < res.length; c++) {
        crc ^= (res.charCodeAt(c) << 8)
        for (let j = 0; j < 8; j++) {
            crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1)
            crc &= 0xFFFF
        }
    }

    return res + crc.toString(16).toUpperCase().padStart(4, '0')
}

async function generateQris(amount) {
    try {
        const ok = new OrderKuota(global.orderkuota.username, global.orderkuota.token)
        let initial_balance = 0
        try {
            const profile = await ok.getProfile()
            const account = profile?.account?.results || profile?.account || profile?.results?.[0]?.account || profile?.results || profile || {}
            initial_balance = Number(account.balance_qris ?? account.saldo_qris ?? account.qris_balance ?? 0)
            console.log(chalk.green(`[QRIS] Check Balance: Rp ${toRupiah(initial_balance)} | User: ${global.orderkuota.username}`))
        } catch (e) {
            console.error(chalk.red('[QRIS] Failed to fetch initial balance:'), e.message)
        }

        const result = await ok.generateQr(amount)
        const qrString = result?.qris_dynamic || result?.qris || result?.qris_string || result?.qris_merchant_terms?.qris || result?.qris_merchant_terms?.qr_string || result?.qris_merchant_terms?.results?.qris_data

        if (qrString && amount) {
            return {
                ...result,
                initial_balance,
                qris_dynamic: createDynamicQris(qrString, amount)
            }
        }

        return { ...result, initial_balance }
    } catch (e) {
        console.error(chalk.red('[QRIS] Error generating QRIS:'), e.message)
        return null
    }
}

async function getTransactionQris(type = '', userId = null) {
    try {
        const ok = new OrderKuota(global.orderkuota.username, global.orderkuota.token)
        return await ok.getTransactionQris(type, userId)
    } catch (e) {
        console.error(chalk.red('[QRIS] Error getting transaction QRIS:'), e.message)
        return null
    }
}

async function getProfile() {
    try {
        const ok = new OrderKuota(global.orderkuota.username, global.orderkuota.token)
        return await ok.getProfile()
    } catch (e) {
        console.error(chalk.red('[PROFILE] Error getting profile:'), e.message)
        return null
    }
}

export {
    checkOrderKuotaBalance,
    generateQris,
    getTransactionQris,
    getProfile,
    OrderKuota,
    parseNominal
}

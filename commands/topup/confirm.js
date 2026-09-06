import { OrderKuota } from '../../library/task.js'
import chalk from 'chalk'
import { cleanJid } from '../../core/utils.js'

const handler = async (m, { conn, text, usedPrefix, command, db, Func }) => {
    conn.confirmPurchase = conn.confirmPurchase || {}
    const choice = text.toLowerCase()

    if (!choice || !['saldo', 'qris'].includes(choice)) {
        return m.reply(`*P O R T A L  P E M B A Y A R A N*\n\nSilakan pilih metode pembayaran:\n1. *${usedPrefix + command} saldo*\n2. *${usedPrefix + command} qris*`)
    }

    const data = conn.confirmPurchase[m.sender]
    if (!data) {
        return m.reply('❌ Tidak ada transaksi yang perlu dikonfirmasi atau transaksi telah kadaluarsa.')
    }

    const { itemID, price, target, produk, type, linkGroup, targetGroup } = data
    const user = db.data.users[m.sender]

    if (choice === 'saldo') {
        if (user.saldo < price) {
            return m.reply(`❌ Saldo Anda tidak cukup.\n\n◦ Saldo Anda: Rp ${Func.formatNumber(user.saldo)}\n◦ Harga Produk: Rp ${Func.formatNumber(price)}\n\nSilakan isi saldo menggunakan perintah *.deposit*`)
        }

        // Proses dengan Saldo
        await m.reply('🔄 *Sedang memproses pesanan dengan Saldo...*')

        try {
            // Jika ini pembelian premium atau sewa, proses internal tanpa OkeConnect
            if (itemID.startsWith('prem') || itemID.startsWith('sewa')) {
                user.saldo -= price
                
                if (itemID.startsWith('prem')) {
                    let hari = itemID.replace('prem', '')
                    hari = /permanen/i.test(hari) ? 9999 : parseInt(hari)
                    let now = Date.now()
                    let durasi = 86400000 * hari
                    let expiredTime = (user.premiumTime && user.premiumTime > now) ? user.premiumTime + durasi : now + durasi
                    user.premiumTime = expiredTime
                    user.premium = { status: true, expired: expiredTime }
                } else if (itemID.startsWith('sewa')) {
                    let isPremiumGroup = itemID.startsWith('sewaprem')
                    let hari = parseInt(itemID.replace(isPremiumGroup ? 'sewaprem' : 'sewa', '')) || 0
                    let groupId = targetGroup || null

                    if (linkGroup && !groupId) {
                        if (linkGroup.includes('internal-renew-')) {
                            groupId = linkGroup.split('internal-renew-')[1] + '@g.us'
                        } else {
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
                                        console.log('[SEWA] groupAcceptInvite maybe already joined:', e.message)
                                    }
                                }
                            } catch (e) { console.error('[SEWA] Error:', e) }
                        }
                    }

                    if (groupId) {
                        groupId = cleanJid(groupId.toString())
                        let groupChat = db.data.chats[groupId] || (db.data.chats[groupId] = { isChats: true })
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

                        if (db.save) await db.save()
                        await conn.sendMessage(groupId, { text: `✅ Berhasil ${linkGroup ? 'join' : 'memperpanjang sewa'} grup melalui layanan sewa bot.\nSewa di grup ini aktif selama ${hari} hari.${isPremiumGroup ? '\n\n✨ Grup ini telah ditingkatkan ke status Premium!' : ''}` }).catch(()=>{})
                    }
                }

                let caption = `*✅ PEMBELIAN BERHASIL*\n\n`
                caption += `◦ Produk: ${produk}\n`
                caption += `◦ Harga: Rp ${Func.formatNumber(price)}\n`
                caption += `◦ Metode: Saldo\n`
                caption += `◦ Sisa Saldo: Rp ${Func.formatNumber(user.saldo)}\n\n`
                caption += `Terima kasih telah berbelanja!`

                await conn.sendMessage(m.chat, { text: caption }, { quoted: m })
                
                user.historyTrx = user.historyTrx || []
                user.historyTrx.push({ trxId: `SALDO_${Date.now()}`, nominal: price, type: produk, time: Date.now() })
                delete conn.confirmPurchase[m.sender]
                return
            }

            // Jika bukan internal, tembak OkeConnect
            const isBebasNominal = itemID.toUpperCase().includes('BBS') || produk.toLowerCase().includes('bebas nominal')
            const refID = `SALDO_${Date.now()}`
            
            const url = new URL('https://h2h.okeconnect.com/trx')
            url.searchParams.append('memberID', global.orderkuota.memberID)
            url.searchParams.append('pin', global.orderkuota.pin)
            url.searchParams.append('password', global.orderkuota.password)
            url.searchParams.append('product', itemID)
            url.searchParams.append('dest', target)
            url.searchParams.append('refID', refID)
            if (isBebasNominal) {
                url.searchParams.append('qty', price)
            }

            console.log(chalk.blue('[OKE-REQUEST]'), url.toString())

            const res = await fetch(url.toString())
            const resultText = await res.text()
            console.log(chalk.blue('[OKE-RESPONSE]'), resultText)

            if (resultText.toLowerCase().includes('proses') || resultText.toLowerCase().includes('sukses') || resultText.includes('Saldo')) {
                user.saldo -= price
                
                let caption = `*✅ PEMBELIAN BERHASIL*\n\n`
                caption += `◦ Produk: ${produk}\n`
                caption += `◦ Tujuan: ${target}\n`
                caption += `◦ Harga: Rp ${Func.formatNumber(price)}\n`
                caption += `◦ Metode: Saldo\n`
                caption += `◦ Sisa Saldo: Rp ${Func.formatNumber(user.saldo)}`

                await conn.sendMessage(m.chat, { text: caption }, { quoted: m })

                user.historyTrx = user.historyTrx || []
                user.historyTrx.push({
                    trxId: refID,
                    nominal: price,
                    type: `Purchase ${produk}`,
                    time: Date.now(),
                    sn: resultText
                })
            } else {
                m.reply(`❌ Gagal memproses pesanan.\n\n*Respon Server:*\n_${resultText.trim()}_`)
            }
        } catch (e) {
            console.error('[CONFIRM SALDO ERROR]', e)
            m.reply('❌ Terjadi kesalahan saat memproses pesanan.')
        }

        delete conn.confirmPurchase[m.sender]

    } else if (choice === 'qris') {
        // Proses dengan QRIS
        if (!conn.quickPurchase) conn.quickPurchase = {}
        if (!conn.transaction) conn.transaction = {}

        if (conn.transaction[m.sender]) return m.reply('Anda masih memiliki transaksi yang belum diselesaikan.')

        conn.quickPurchase[m.sender] = {
            chat: m.chat,
            itemID: itemID,
            number: m.sender,
            harga: price,
            produk: produk,
            image: null,
            type: `topup_${type}`,
            customer_name: m.pushName || m.name || 'User',
            target: target,
            linkGroup: linkGroup,
            targetGroup: data.targetGroup
        }

        m.reply(`🔄 *Memproses Pembayaran QRIS...*\nMohon tunggu maksimal 10 detik, bot akan mengirimkan QRIS untuk ${produk}.`)
        delete conn.confirmPurchase[m.sender]
    }
}

handler.command = ['confirm', 'bayar']
handler.tags = ['topup']
handler.register = true

export default handler

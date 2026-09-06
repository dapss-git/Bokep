import {
    getTransactionQris,
    parseNominal
} from '../../library/task.js'

let toRupiah = number => parseInt(number).toLocaleString('id-ID')

const handler = async (m, {
    conn,
    text,
    usedPrefix,
    command,
    isOwner,
    Func
}) => {
    const args = text?.trim().split(/\s+/) || []
    const sub = args[0]?.toLowerCase()

    if (sub === 'help' || sub === 'bantuan') {
        return m.reply(
            `*📊 MUTASI QRIS*\n\n` +
            `*Cara pakai:*\n` +
            `◦ ${usedPrefix + command} — semua mutasi terbaru\n` +
            `◦ ${usedPrefix + command} masuk — hanya pemasukan\n` +
            `◦ ${usedPrefix + command} keluar — hanya pengeluaran\n` +
            `◦ ${usedPrefix + command} <angka> — filter nominal tertentu\n` +
            `◦ ${usedPrefix + command} cari <kata> — cari berdasarkan nama/keterangan\n\n` +
            `*Contoh:*\n` +
            `◦ ${usedPrefix + command} masuk\n` +
            `◦ ${usedPrefix + command} 50000\n` +
            `◦ ${usedPrefix + command} cari budi`
        )
    }

    if (!isOwner) return m.reply('❌ Perintah ini hanya bisa digunakan oleh owner.')

    if (!global.orderkuota?.username || !global.orderkuota?.token) {
        return m.reply('❌ Kredensial OrderKuota belum dikonfigurasi.')
    }

    await m.reply('⏳ Mengambil data mutasi...')

    try {
        let filterJenis = ''
        if (sub === 'masuk') filterJenis = 'masuk'
        else if (sub === 'keluar') filterJenis = 'keluar'

        const raw = await getTransactionQris(filterJenis)

        if (!raw) return m.reply('❌ Gagal mengambil data mutasi dari server.')

        let histories = raw?.qris_history?.results || raw?.results || raw?.data || []

        if (!Array.isArray(histories) || histories.length === 0) {
            return m.reply('📭 Tidak ada data mutasi yang tersedia saat ini.')
        }

        const checkIsIn = (v) => {
            const j = (v.jenis || v.type || v.status || '').toString().toUpperCase()
            if (j === 'IN' || j === 'MASUK' || j === 'CR' || j === 'CREDIT' || j === 'SUCCESS' || j === 'PAID') return true
            if (j === 'OUT' || j === 'KELUAR' || j === 'DB' || j === 'DEBIT' || j === 'SETTLEMENT') return false
            if (Number(v.kredit) > 0) return true
            if (Number(v.debet) > 0) return false
            return true
        }

        if (filterJenis) {
            histories = histories.filter(v => {
                const isIn = checkIsIn(v)
                return filterJenis === 'masuk' ? isIn : !isIn
            })
            if (histories.length === 0) return m.reply(`📭 Tidak ada mutasi ${filterJenis.toUpperCase()} saat ini.`)
        }

        if (sub === 'cari') {
            const keyword = args.slice(1).join(' ').toLowerCase()
            if (!keyword) return m.reply(`Masukan kata kunci, contoh: *${usedPrefix + command} cari budi*`)
            histories = histories.filter(v => {
                const haystack = [
                    v.nama, v.pengirim, v.keterangan, v.catatan,
                    v.bank, v.issuer, v.merchant_name, v.note, v.description
                ].filter(Boolean).join(' ').toLowerCase()
                return haystack.includes(keyword)
            })
            if (histories.length === 0) return m.reply(`📭 Tidak ada mutasi dengan kata kunci *"${keyword}"*.`)
        } else if (sub && !isNaN(sub)) {
            const targetAmount = Number(sub)
            histories = histories.filter(v => {
                return parseNominal(v) === targetAmount
            })
            if (histories.length === 0) return m.reply(`📭 Tidak ada mutasi dengan nominal *Rp ${toRupiah(targetAmount)}*.`)
        }

        const limit = 10
        const total = histories.length
        const displayed = histories.slice(0, limit)

        let totalMasuk = 0
        let totalKeluar = 0

        for (const v of histories) {
            const nominal = parseNominal(v)
            if (checkIsIn(v)) {
                totalMasuk += nominal
            } else {
                totalKeluar += nominal
            }
        }

        let caption = `*📊 MUTASI QRIS*\n`
        if (filterJenis) caption += `Filter: *${filterJenis.toUpperCase()}*\n`
        caption += `\n`
        caption += `🟢 Total Masuk : *Rp ${toRupiah(totalMasuk)}*\n`
        caption += `🔴 Total Keluar: *Rp ${toRupiah(totalKeluar)}*\n`
        caption += `📋 Data Tampil : ${displayed.length} dari ${total} transaksi\n`
        caption += `${'─'.repeat(30)}\n\n`

        for (let i = 0; i < displayed.length; i++) {
            const v = displayed[i]
            const nominal = parseNominal(v)
            const isIn = checkIsIn(v)
            const icon = isIn ? '🟢' : '🔴'
            const label = isIn ? 'Masuk' : 'Keluar'

            const pengirim = (v.nama || v.pengirim || v.merchant_name || v.issuer || v.sender || v.source || '-').toString()
            let bank = v.bank || v.issuer_name || v.brand || ''
            if (typeof bank === 'object') bank = bank.name || bank.brand || bank.issuer || ''
            
            const waktu = v.tanggal || v.date || v.created_at || v.datetime || '-'
            const id = v.id || v.trxid || v.reference || v.payment_id || '-'
            const ket = v.keterangan || v.catatan || v.note || v.description || ''

            caption += `${icon} *${label}* — Rp ${toRupiah(nominal)}\n`
            caption += `👤 ${pengirim}${bank ? ` (${bank})` : ''}\n`
            caption += `🕐 ${waktu}\n`
            caption += `🆔 ${id}\n`
            if (ket) caption += `📝 ${ket}\n`
            if (i < displayed.length - 1) caption += `\n`
        }

        if (total > limit) {
            caption += `\n_...dan ${total - limit} transaksi lainnya._`
        }

        await conn.sendMessage(m.chat, {
            text: caption,
            footer: global.footer,
            buttons: [{
                    buttonId: `${usedPrefix + command} masuk`,
                    buttonText: {
                        displayText: '🟢 Mutasi Masuk'
                    },
                    type: 1
                },
                {
                    buttonId: `${usedPrefix + command} keluar`,
                    buttonText: {
                        displayText: '🔴 Mutasi Keluar'
                    },
                    type: 1
                },
                {
                    buttonId: `${usedPrefix + command} help`,
                    buttonText: {
                        displayText: '❓ Bantuan'
                    },
                    type: 1
                }
            ],
            headerType: 1,
            viewOnce: true
        }, {
            quoted: m
        })

    } catch (e) {
        console.error('[MUTASI]', e.message)
        m.reply('❌ Terjadi kesalahan saat mengambil data mutasi.')
    }
}

handler.help = ['mutasi [masuk|keluar|<nominal>|cari <kata>]']
handler.tags = ['topup']
handler.command = ['mutasi', 'riwayat']
handler.owner = true

handler.register = true

export default handler
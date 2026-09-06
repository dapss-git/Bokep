import axios from 'axios'

const operatorPrefixes = {
    telkomsel: ['0811','0812','0813','0821','0822','0852','0853','0823','0851'],
    indosat: ['0814','0815','0816','0855','0856','0857','0858'],
    xl: ['0817','0818','0819','0859','0877','0878'],
    axis: ['0831','0832','0833','0838'],
    three: ['0895','0896','0897','0898','0899'],
    smartfren: ['0881','0882','0883','0884','0885','0886','0887','0888','0889']
}

function getOperator(phone) {
    if (!phone) return null
    let prefix = phone.substring(0, 4)
    for (const [op, prefixes] of Object.entries(operatorPrefixes)) {
        if (prefixes.includes(prefix)) return op
    }
    return null
}

const handler = async (m, { conn, text, usedPrefix, command, Func }) => {
    const targetMatch = text ? text.match(/(08\d{7,11})/) : null
    const target = targetMatch ? targetMatch[0] : null

    if (!target) {
        return m.reply(`*T O P U P  K U O T A*\n\nGunakan perintah ini dengan menyertakan nomor HP tujuan.\n\n*Contoh:* ${usedPrefix + command} 081234567890`)
    }

    const op = getOperator(target)
    if (!op) {
        return m.reply('❌ Nomor tidak dikenali atau operator tidak didukung.')
    }

    try {
        const { data } = await axios.get('https://okeconnect.com/harga/json?id=905ccd028329b0a')
        
        let products = data.filter(item => {
            if (item.status !== '1') return false
            const isKuota = item.kategori.includes('KUOTA') || item.kategori.includes('DATA') || item.kategori.includes('BULK') || item.kategori.includes('VOUCHER')
            const opMatch = item.produk.toLowerCase().includes(op) || item.keterangan.toLowerCase().includes(op) || item.kategori.toLowerCase().includes(op) || (op === 'three' && (item.keterangan.toLowerCase().includes('tri') || item.kategori.toLowerCase().includes('tri')))
            return isKuota && opMatch
        })

        products.sort((a, b) => parseInt(a.harga) - parseInt(b.harga))

        let packages = {}
        products.forEach(item => {
            packages[item.kode.toUpperCase()] = {
                id: item.kode,
                name: item.keterangan,
                price: parseInt(item.harga)
            }
        })

        const allKeys = Object.keys(packages)
        if (allKeys.length === 0) {
            return m.reply(`Maaf, produk kuota untuk ${op.toUpperCase()} sedang tidak tersedia.`)
        }

        const args = text.split(' ')
        const planArg = args.find(a => packages[a.toUpperCase()])

        if (!planArg) {
            let sections = []
            let currentRows = []
            let sectionIndex = 1

            allKeys.forEach((key, index) => {
                const pkg = packages[key]
                currentRows.push({
                    title: pkg.name,
                    id: `${usedPrefix + command} ${key} ${target}`,
                    description: `Harga: Rp ${Func.formatNumber(pkg.price)}`
                })

                if (currentRows.length >= 20 || index === allKeys.length - 1) {
                    sections.push({
                        title: `Pilihan Kuota (Bagian ${sectionIndex++})`,
                        rows: currentRows
                    })
                    currentRows = []
                }
            })

            await conn.sendMessage(m.chat, {
                text: `*T O P U P  K U O T A*\n\n◦ *Operator:* ${op.toUpperCase()}\n◦ *Nomor:* ${target}\n◦ *Total:* ${allKeys.length} Pilihan\n\nSilakan pilih paket data / kuota di bawah ini.`,
                footer: global.footer,
                buttons: [{
                    buttonId: "kuota_select",
                    buttonText: { displayText: "🛒 Pilih Paket Kuota" },
                    type: 4,
                    nativeFlowInfo: {
                        name: "single_select",
                        paramsJson: JSON.stringify({
                            title: `Kuota ${op.toUpperCase()}`,
                            sections: sections
                        })
                    }
                }],
                headerType: 1,
                viewOnce: true
            }, { quoted: m })
            return
        }

        const selected = packages[planArg.toUpperCase()]
        
        if (!conn.quickPurchase) conn.quickPurchase = {}
        if (!conn.transaction) conn.transaction = {}

        if (conn.transaction[m.sender]) return m.reply('Anda masih memiliki transaksi yang belum diselesaikan.')
        if (conn.quickPurchase[m.sender]) return m.reply('Sistem sedang memproses permintaan Anda sebelumnya.')

        conn.quickPurchase[m.sender] = {
            chat: m.chat,
            itemID: selected.id,
            number: m.sender,
            harga: selected.price,
            produk: selected.name,
            image: null,
            type: `topup_kuota`,
            customer_name: m.pushName || m.name || 'User',
            target: target
        }

        m.reply(`🔄 *Memproses Pembayaran...*\nMohon tunggu maksimal 10 detik, bot akan mengirimkan QRIS untuk ${selected.name}.`)

    } catch (e) {
        console.error('[KUOTA FETCH]', e)
        m.reply('Sedang gangguan, gagal mengambil data dari server.')
    }
}

handler.help = ['kuota <nomor>', 'data <nomor>']
handler.tags = ['topup']
handler.command = ['kuota', 'data', 'paketdata']
handler.register = true

export default handler

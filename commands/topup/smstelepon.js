import axios from 'axios'

const handler = async (m, { conn, text, usedPrefix, command, Func }) => {
    const args = text.split(' ')
    const target = args[0]

    if (!target) {
        let msg = `*T O P U P  P A K E T  S M S  &  N E L P O N*\n\n`
        msg += `Gunakan perintah ini dengan menyertakan *Nomor Tujuan / ID Pelanggan*.\n\n`
        msg += `*Contoh:* ${usedPrefix + command} 123456789\n`
        return m.reply(msg)
    }
    
    const category = 'SMS TELEPON'

    try {
        const { data } = await axios.get('https://okeconnect.com/harga/json?id=905ccd028329b0a')
        
        let products = data.filter(item => {
            if (item.status !== '1') return false
            return item.kategori === category && parseInt(item.harga) >= 1000
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
            return m.reply(`Maaf, layanan Paket SMS & Telepon sedang tidak tersedia saat ini.`)
        }

        const planArg = args[1] ? packages[args[1].toUpperCase()] : null

        if (!planArg) {
            let sections = []
            let currentRows = []
            let sectionIndex = 1

            allKeys.forEach((key, index) => {
                const pkg = packages[key]
                currentRows.push({
                    title: pkg.name,
                    id: `${usedPrefix + command} ${target} ${key}`,
                    description: `Harga: Rp ${Func.formatNumber(pkg.price)}`
                })

                if (currentRows.length >= 20 || index === allKeys.length - 1) {
                    sections.push({
                        title: `Pilihan Layanan (Bagian ${sectionIndex++})`,
                        rows: currentRows
                    })
                    currentRows = []
                }
            })

            await conn.sendMessage(m.chat, {
                text: `*L A Y A N A N  P A K E T  S M S  &  N E L P O N*\n\n◦ *Nomor / ID:* ${target}\n◦ *Total Layanan:* ${allKeys.length} Pilihan\n\nSilakan pilih layanan di bawah ini.`,
                footer: global.footer,
                buttons: [{
                    buttonId: "other_select",
                    buttonText: { displayText: "🛒 Pilih Layanan" },
                    type: 4,
                    nativeFlowInfo: {
                        name: "single_select",
                        paramsJson: JSON.stringify({
                            title: `Paket SMS & Telepon`,
                            sections: sections
                        })
                    }
                }],
                headerType: 1,
                viewOnce: true
            }, { quoted: m })
            return
        }

        const selected = planArg
        
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
            type: `topup_other`,
            customer_name: m.pushName || m.name || 'User',
            target: target
        }

        m.reply(`🔄 *Memproses Pembayaran...*\nMohon tunggu maksimal 10 detik, bot akan mengirimkan QRIS untuk ${selected.name}.`)

    } catch (e) {
        console.error('[OTHER FETCH]', e)
        m.reply('Sedang gangguan, gagal mengambil data dari server.')
    }
}

handler.help = ['smstelepon', 'sms', 'nelpon'].map(v => v + ' <nomor_tujuan>')
handler.tags = ['topup']
handler.command = ['smstelepon', 'sms', 'nelpon']
handler.register = true

export default handler

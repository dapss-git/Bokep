import axios from 'axios'

const handler = async (m, { conn, text, usedPrefix, command, Func }) => {
    const targetMatch = text ? text.match(/(\d{11,12})/) : null
    const target = targetMatch ? targetMatch[0] : null

    if (!target) {
        return m.reply(`*T O K E N  P L N*\n\nGunakan perintah ini dengan menyertakan nomor meteran / ID Pelanggan.\n\n*Contoh:* ${usedPrefix + command} 12345678901`)
    }

    try {
        const { data } = await axios.get('https://okeconnect.com/harga/json?id=905ccd028329b0a')
        
        let products = data.filter(item => item.status === '1' && item.kategori === 'TOKEN PLN')
        
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
            return m.reply(`Maaf, produk token PLN sedang tidak tersedia.`)
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
                        title: `Pilihan Nominal (Bagian ${sectionIndex++})`,
                        rows: currentRows
                    })
                    currentRows = []
                }
            })

            await conn.sendMessage(m.chat, {
                text: `*T O K E N  P L N*\n\n◦ *Nomor Meter:* ${target}\n◦ *Total:* ${allKeys.length} Pilihan\n\nSilakan pilih nominal token di bawah ini.`,
                footer: global.footer,
                buttons: [{
                    buttonId: "pln_select",
                    buttonText: { displayText: "🛒 Pilih Nominal Token" },
                    type: 4,
                    nativeFlowInfo: {
                        name: "single_select",
                        paramsJson: JSON.stringify({
                            title: `Token PLN`,
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
            type: `topup_pln`,
            customer_name: m.pushName || m.name || 'User',
            target: target
        }

        m.reply(`🔄 *Memproses Pembayaran...*\nMohon tunggu maksimal 10 detik, bot akan mengirimkan QRIS untuk ${selected.name}.`)

    } catch (e) {
        console.error('[PLN FETCH]', e)
        m.reply('Sedang gangguan, gagal mengambil data dari server.')
    }
}

handler.help = ['pln <nomor_meter>']
handler.tags = ['topup']
handler.command = ['pln', 'tokenpln', 'token']
handler.register = true

export default handler

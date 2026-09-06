import axios from 'axios'

const handler = async (m, { conn, text, usedPrefix, command, Func }) => {
    const args = text.split(' ')
    const target = args[0] || m.sender.split('@')[0] // Default to user number if not provided

    const category = 'CETAK VOUCHER'

    try {
        const { data } = await axios.get('https://okeconnect.com/harga/json?id=905ccd028329b0a')
        
        let products = data.filter(item => {
            if (item.status !== '1') return false
            return item.kategori === category
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
            return m.reply(`Maaf, layanan Cetak Voucher sedang tidak tersedia.`)
        }

        const planArg = args.find(a => packages[a.toUpperCase()])

        if (!planArg) {
            let sections = []
            let currentRows = []
            let sectionIndex = 1

            allKeys.forEach((key, index) => {
                const pkg = packages[key]
                currentRows.push({
                    title: pkg.name,
                    id: `${usedPrefix + command} ${key}`,
                    description: `Harga: Rp ${Func.formatNumber(pkg.price)}`
                })

                if (currentRows.length >= 20 || index === allKeys.length - 1) {
                    sections.push({
                        title: `Pilihan Voucher (Bagian ${sectionIndex++})`,
                        rows: currentRows
                    })
                    currentRows = []
                }
            })

            await conn.sendMessage(m.chat, {
                text: `*B E L I  V O U C H E R  F I S I K*\n\n◦ *Total Produk:* ${allKeys.length} Pilihan\n\nSilakan pilih voucher yang ingin Anda beli di bawah ini. Kode voucher akan dikirimkan setelah pembayaran berhasil.`,
                footer: global.footer,
                buttons: [{
                    buttonId: "voucher_select",
                    buttonText: { displayText: "🛒 Pilih Voucher" },
                    type: 4,
                    nativeFlowInfo: {
                        name: "single_select",
                        paramsJson: JSON.stringify({
                            title: `Cetak Voucher`,
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
        
        conn.confirmPurchase = conn.confirmPurchase || {}
        conn.confirmPurchase[m.sender] = {
            itemID: selected.id,
            price: selected.price,
            target: target,
            produk: selected.name,
            type: 'voucher'
        }

        let msg = `*K O N F I R M A S I  P E M B A Y A R A N*\n\n`
        msg += `◦ Produk: ${selected.name}\n`
        msg += `◦ Harga: Rp ${Func.formatNumber(selected.price)}\n\n`
        msg += `Silakan pilih metode pembayaran di bawah ini.`

        await conn.sendMessage(m.chat, {
            text: msg,
            footer: global.footer,
            buttons: [
                { buttonId: `${usedPrefix}confirm saldo`, buttonText: { displayText: '💰 Saldo' }, type: 1 },
                { buttonId: `${usedPrefix}confirm qris`, buttonText: { displayText: '📱 QRIS (Otomatis)' }, type: 1 }
            ],
            headerType: 1,
            viewOnce: true
        }, { quoted: m })

    } catch (e) {
        console.error('[VOUCHER FETCH]', e)
        m.reply('Sedang gangguan, gagal mengambil data dari server.')
    }
}

handler.help = ['cetakvoucher', 'beliovoucher', 'vouchertv']
handler.tags = ['topup']
handler.command = ['cetakvoucher', 'belivoucher', 'vouchertv', 'voucher']
handler.register = true

export default handler

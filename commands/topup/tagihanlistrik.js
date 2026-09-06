import axios from 'axios'

const handler = async (m, { conn, text, usedPrefix, command, Func }) => {
    const args = text.split(' ')
    const target = args[0]

    if (!target) {
        let msg = `*P E M B A Y A R A N  T A G I H A N  L I S T R I K*\n\n`
        msg += `Gunakan perintah ini dengan menyertakan *Nomor Meter / ID Pelanggan*.\n\n`
        msg += `*Contoh:* ${usedPrefix + command} 51234567890\n`
        return m.reply(msg)
    }
    
    const search = 'Tagihan Listrik'

    try {
        const { data } = await axios.get('https://okeconnect.com/harga/json?id=905ccd028329b0a')
        
        let products = data.filter(item => {
            if (item.status !== '1') return false
            const isBill = item.kategori === 'TAGIHAN' || item.kategori === 'PASCABAYAR'
            const matchSearch = item.keterangan.toLowerCase().includes(search.toLowerCase())
            return isBill && matchSearch
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
            return m.reply(`Maaf, layanan bayar tagihan listrik sedang tidak tersedia.`)
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
                    description: `Admin: Rp ${Func.formatNumber(pkg.price)}`
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
                text: `*T A G I H A N  L I S T R I K  (P L N)*\n\n◦ *ID Pelanggan:* ${target}\n◦ *Total Produk:* ${allKeys.length} Pilihan\n\nSilakan pilih layanan di bawah ini.`,
                footer: global.footer,
                buttons: [{
                    buttonId: "listrik_select",
                    buttonText: { displayText: "🛒 Pilih Layanan" },
                    type: 4,
                    nativeFlowInfo: {
                        name: "single_select",
                        paramsJson: JSON.stringify({
                            title: `Tagihan Listrik`,
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
        
        conn.confirmPurchase = conn.confirmPurchase || {}
        conn.confirmPurchase[m.sender] = {
            itemID: selected.id,
            price: selected.price,
            target: target,
            produk: selected.name,
            type: 'listrik'
        }

        let msg = `*K O N F I R M A S I  P E M B A Y A R A N*\n\n`
        msg += `◦ Produk: ${selected.name}\n`
        msg += `◦ ID Pelanggan: ${target}\n`
        msg += `◦ Harga/Admin: Rp ${Func.formatNumber(selected.price)}\n\n`
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
        console.error('[LISTRIK FETCH]', e)
        m.reply('Sedang gangguan, gagal mengambil data dari server.')
    }
}

handler.help = ['tagihanlistrik <id>', 'listrik <id>', 'plnpasca <id>']
handler.tags = ['topup']
handler.command = ['tagihanlistrik', 'listrik', 'plnpasca']
handler.register = true

export default handler

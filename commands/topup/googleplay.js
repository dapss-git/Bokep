import axios from 'axios'

const handler = async (m, { conn, text, usedPrefix, command, Func }) => {
    const args = text.split(' ')
    const target = args[0]

    if (!target) {
        let msg = `*T O P U P  G O O G L E  P L A Y*\n\n`
        msg += `Gunakan perintah ini dengan menyertakan *Nomor HP* tujuan.\n\n`
        msg += `*Contoh:* ${usedPrefix + command} 08123456789\n`
        return m.reply(msg)
    }
    
    const search = 'google play'

    try {
        const { data } = await axios.get('https://okeconnect.com/harga/json?id=905ccd028329b0a')
        
        let products = data.filter(item => {
            if (item.status !== '1') return false
            const matchSearch = item.keterangan.toLowerCase().includes(search) || item.produk.toLowerCase().includes(search)
            return matchSearch
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
            return m.reply(`Maaf, produk Google Play sedang tidak tersedia.`)
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
                        title: `Pilihan Paket (Bagian ${sectionIndex++})`,
                        rows: currentRows
                    })
                    currentRows = []
                }
            })

            await conn.sendMessage(m.chat, {
                text: `*T O P U P  G O O G L E  P L A Y*\n\n◦ *Nomor HP:* ${target}\n◦ *Total Produk:* ${allKeys.length} Pilihan\n\nSilakan pilih paket di bawah ini.`,
                footer: global.footer,
                buttons: [{
                    buttonId: "googleplay_select",
                    buttonText: { displayText: "🛒 Pilih Paket" },
                    type: 4,
                    nativeFlowInfo: {
                        name: "single_select",
                        paramsJson: JSON.stringify({
                            title: `Topup Google Play`,
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
            type: 'googleplay'
        }

        let msg = `*K O N F I R M A S I  P E M B A Y A R A N*\n\n`
        msg += `◦ Produk: ${selected.name}\n`
        msg += `◦ Nomor HP: ${target}\n`
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
        console.error('[GOOGLEPLAY FETCH]', e)
        m.reply('Sedang gangguan, gagal mengambil data dari server.')
    }
}

handler.help = ['googleplay <nomor>']
handler.tags = ['topup']
handler.command = ['googleplay', 'playstore']
handler.register = true

export default handler

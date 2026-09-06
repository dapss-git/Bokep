import axios from 'axios'

const handler = async (m, { conn, text, usedPrefix, command, Func }) => {
    const args = text.split(' ')
    const target = args[0]

    if (!target) {
        let msg = `*T O P U P  M O B I L E  L E G E N D S*\n\n`
        msg += `Gunakan perintah ini dengan menyertakan *ID Player* (gabung dengan server).\n\n`
        msg += `*Contoh:* ${usedPrefix + command} 12345678(1234)\n`
        return m.reply(msg)
    }
    
    const search = 'mobile legend'

    try {
        const { data } = await axios.get('https://okeconnect.com/harga/json?id=905ccd028329b0a')
        
        let products = data.filter(item => {
            if (item.status !== '1') return false
            const isDigital = item.kategori === 'DIGITAL' || item.kategori.includes('GAME')
            const matchSearch = item.keterangan.toLowerCase().includes(search) || item.produk.toLowerCase().includes(search)
            return isDigital && matchSearch
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
            return m.reply(`Maaf, produk game untuk Mobile Legends sedang tidak tersedia.`)
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
                        title: `Pilihan Nominal (Bagian ${sectionIndex++})`,
                        rows: currentRows
                    })
                    currentRows = []
                }
            })

            await conn.sendMessage(m.chat, {
                text: `*T O P U P  M O B I L E  L E G E N D S*\n\n◦ *ID Player:* ${target}\n◦ *Total Produk:* ${allKeys.length} Pilihan\n\nSilakan pilih nominal di bawah ini.`,
                footer: global.footer,
                buttons: [{
                    buttonId: "gameml_select",
                    buttonText: { displayText: "🛒 Pilih Nominal" },
                    type: 4,
                    nativeFlowInfo: {
                        name: "single_select",
                        paramsJson: JSON.stringify({
                            title: `Topup Mobile Legends`,
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
            type: 'ml'
        }

        let msg = `*K O N F I R M A S I  P E M B A Y A R A N*\n\n`
        msg += `◦ Produk: ${selected.name}\n`
        msg += `◦ ID Player: ${target}\n`
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
        console.error('[GAME ML FETCH]', e)
        m.reply('Sedang gangguan, gagal mengambil data dari server.')
    }
}

handler.help = ['topupml <id>']
handler.tags = ['topup']
handler.command = ['topupml', 'ml']
handler.register = true

export default handler

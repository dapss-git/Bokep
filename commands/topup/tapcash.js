import axios from 'axios'

const handler = async (m, { conn, text, usedPrefix, command, Func }) => {
    const targetMatch = text ? text.match(/(\d{10,20})/) : null
    const target = targetMatch ? targetMatch[0] : null

    if (!target) {
        let msg = `*T O P U P  T A P C A S H  B N I*\n\n`
        msg += `Gunakan perintah ini dengan menyertakan Nomor Kartu / ID tujuan.\n\n`
        msg += `*Contoh:* ${usedPrefix + command} 1234567890123456\n`
        return m.reply(msg)
    }

    let packages = {}
    try {
        const { data } = await axios.get('https://okeconnect.com/harga/json?id=905ccd028329b0a')
        
        const filteredData = data.filter(item => {
            const desc = item.keterangan.toLowerCase()
            const isMatch = /\btap cash\b/.test(desc) || /\btapcash\b/.test(desc)
            return isMatch && 
                   !desc.includes('bebas nominal') && 
                   !desc.includes('cek') &&
                   !desc.includes('bayar') &&
                   parseInt(item.harga) >= 1000 &&
                   item.status === '1'
        })

        filteredData.sort((a, b) => parseInt(a.harga) - parseInt(b.harga))

        filteredData.forEach(item => {
            packages[item.kode.toUpperCase()] = {
                id: item.kode,
                name: item.keterangan,
                price: parseInt(item.harga)
            }
        })

    } catch (e) {
        console.error(`[TOPUP TapCash BNI FETCH]`, e)
        return m.reply('Sedang gangguan, gagal mengambil daftar harga dari server.')
    }

    const allKeys = Object.keys(packages)
    if (allKeys.length === 0) {
        return m.reply(`Maaf, produk topup TapCash BNI sedang tidak tersedia atau gangguan dari server.`)
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
                    title: `Daftar Nominal (Bagian ${sectionIndex++})`,
                    rows: currentRows
                })
                currentRows = []
            }
        })

        await conn.sendMessage(m.chat, {
            text: `*T O P U P  T A P C A S H  B N I*\n\n◦ *Nomor Tujuan:* ${target}\n◦ *Total Produk:* ${allKeys.length} Pilihan\n\nSilakan pilih nominal topup di bawah ini.`,
            footer: global.footer,
            buttons: [{
                buttonId: "topupemoney_select",
                buttonText: {
                    displayText: "🛒 Pilih Nominal Topup"
                },
                type: 4,
                nativeFlowInfo: {
                    name: "single_select",
                    paramsJson: JSON.stringify({
                        title: `Nominal TapCash BNI`,
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

    if (conn.transaction[m.sender]) {
        return m.reply('Anda masih memiliki transaksi yang belum diselesaikan. Selesaikan atau tunggu hingga kadaluarsa (5 menit).')
    }

    if (conn.quickPurchase[m.sender]) {
        return m.reply('Sistem sedang memproses permintaan Anda sebelumnya, mohon tunggu sebentar.')
    }

    conn.quickPurchase[m.sender] = {
        chat: m.chat,
        itemID: selected.id,
        number: m.sender,
        harga: selected.price,
        produk: selected.name,
        image: null,
        type: `topup_bank`,
        customer_name: m.pushName || m.name || 'User',
        target: target 
    }

    m.reply(`🔄 *Memproses Pembayaran...*\nMohon tunggu maksimal 10 detik, bot akan mengirimkan QRIS untuk ${selected.name}.\n\n_Pastikan nomor kartu ${target} benar._`)
}

handler.help = ['tapcash <nomor>']
handler.tags = ['topup']
handler.command = ['topuptapcash', 'tapcash', 'bni']
handler.register = true

export default handler

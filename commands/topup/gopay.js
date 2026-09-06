import axios from 'axios'

const handler = async (m, { conn, text, usedPrefix, command, Func }) => {
    const ewallet = 'GOPAY'
    const typeStr = 'gopay'

    const targetMatch = text ? text.match(/(08\d{7,11})/) : null
    const target = targetMatch ? targetMatch[0] : null

    if (!target) {
        let msg = `*T O P U P  ${ewallet}*\n\n`
        msg += `Gunakan perintah ini dengan menyertakan nomor ${ewallet} tujuan, lalu pilih nominal topup.\n\n`
        msg += `*Contoh:* ${usedPrefix + command} 081234567890\n`
        return m.reply(msg)
    }

    let packages = {}
    try {
        const { data } = await axios.get('https://okeconnect.com/harga/json?id=905ccd028329b0a')
        
        const filteredData = data.filter(item => {
            const desc = item.keterangan.toLowerCase()
            const isMatch = /\bgopay\b/.test(desc) || /\bgojek\b/.test(desc)
            return isMatch && !desc.includes('bebas nominal') && !desc.includes('cek') && parseInt(item.harga) >= 1000
        })

        filteredData.sort((a, b) => parseInt(a.harga) - parseInt(b.harga))

        filteredData.forEach(item => {
            packages[item.kode.toUpperCase()] = {
                id: item.kode, name: item.keterangan, price: parseInt(item.harga)
            }
        })
    } catch (e) {
        console.error(`[TOPUP ${ewallet} FETCH]`, e)
        return m.reply('Sedang gangguan, gagal mengambil daftar harga dari server.')
    }

    const allKeys = Object.keys(packages)
    if (allKeys.length === 0) return m.reply(`Maaf, produk topup ${ewallet} sedang tidak tersedia.`)

    const args = text.split(' ')
    const planArg = args.find(a => packages[a.toUpperCase()])

    if (!planArg) {
        let sections = [], currentRows = [], sectionIndex = 1
        allKeys.forEach((key, index) => {
            currentRows.push({
                title: packages[key].name,
                id: `${usedPrefix + command} ${key} ${target}`,
                description: `Harga: Rp ${Func.formatNumber(packages[key].price)}`
            })
            if (currentRows.length >= 20 || index === allKeys.length - 1) {
                sections.push({ title: `Daftar Nominal (Bagian ${sectionIndex++})`, rows: currentRows })
                currentRows = []
            }
        })

        await conn.sendMessage(m.chat, {
            text: `*T O P U P  ${ewallet}*\n\n◦ *Nomor Tujuan:* ${target}\n◦ *Total Produk:* ${allKeys.length} Pilihan\n\nSilakan pilih nominal topup ${ewallet} di bawah ini.`,
            footer: global.footer,
            buttons: [{
                buttonId: `topup${typeStr}_select`,
                buttonText: { displayText: "🛒 Pilih Nominal Topup" },
                type: 4,
                nativeFlowInfo: { name: "single_select", paramsJson: JSON.stringify({ title: `Nominal ${ewallet}`, sections }) }
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
        type: typeStr
    }

    let msg = `*K O N F I R M A S I  P E M B A Y A R A N*\n\n`
    msg += `◦ Produk: ${selected.name}\n`
    msg += `◦ Nomor Tujuan: ${target}\n`
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
}

handler.help = ['gopay <nomor>']
handler.tags = ['topup']
handler.command = ['topupgopay', 'gopay', 'gojek']
handler.register = true

export default handler

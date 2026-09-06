const handler = async (m, { conn, text, usedPrefix, command, Func }) => {
    // Definisi Paket Premium
    const packages = {
        '7': { id: 'prem7', name: 'Premium 7 Hari', price: 5000 },
        '30': { id: 'prem30', name: 'Premium 30 Hari', price: 15000 },
        'permanen': { id: 'prempermanen', name: 'Premium Permanen', price: 50000 }
    }

    // Jika tanpa argumen, tampilkan list paket dengan single_select button
    if (!text || !packages[text.toLowerCase()]) {
        const rows = Object.keys(packages).map(key => {
            const pkg = packages[key]
            return {
                title: pkg.name,
                id: `${usedPrefix + command} ${key}`,
                description: `Harga: Rp ${Func.formatNumber(pkg.price)}`
            }
        })

        await conn.sendMessage(m.chat, {
            text: `*B U Y  P R E M I U M*\n\nSilakan pilih paket premium yang tersedia di bawah ini.`,
            footer: global.footer,
            buttons: [{
                buttonId: "buyprem_select",
                buttonText: {
                    displayText: "🛒 Pilih Paket Premium"
                },
                type: 4,
                nativeFlowInfo: {
                    name: "single_select",
                    paramsJson: JSON.stringify({
                        title: "Paket Premium",
                        sections: [{
                            title: "Daftar Paket",
                            rows: rows
                        }]
                    })
                }
            }],
            headerType: 1,
            viewOnce: true
        }, { quoted: m })
        return
    }

    // Proses pembelian paket
    const selected = packages[text.toLowerCase()]
    
    conn.confirmPurchase = conn.confirmPurchase || {}
    conn.confirmPurchase[m.sender] = {
        itemID: selected.id,
        price: selected.price,
        target: m.sender,
        produk: selected.name,
        type: 'purchase'
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
}

handler.help = ['buyprem']
handler.tags = ['main']
handler.command = ['buyprem', 'premium']
handler.register = true

export default handler

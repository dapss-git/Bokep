const handler = async (m, { conn, text, usedPrefix, command, Func }) => {
    // Definisi Paket Sewa Bot
    const packages = {
        '10': { id: 'sewa10', name: 'Sewa Bot 10 Hari', price: 5000 },
        '20': { id: 'sewa20', name: 'Sewa Bot 20 Hari', price: 10000 },
        '30': { id: 'sewa30', name: 'Sewa Bot 30 Hari', price: 15000 },
        '40': { id: 'sewa40', name: 'Sewa Bot 40 Hari', price: 20000 }
    }

    // Cek ketersediaan link grup di input
    const linkMatch = text ? text.match(/(?:https?:\/\/)?chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i) : null
    const linkGroup = linkMatch ? linkMatch[0] : null

    // Validasi Argumen: Jika tanpa link atau format salah
    if (!linkGroup) {
        let msg = `*C A R A  P E N G G U N A A N*\n\n`
        msg += `Gunakan perintah ini dengan menyertakan link grup, lalu bot akan menampilkan pilihan paket. Jika sudah memilih paket, bot akan memberikan QRIS dan otomatis join grup Anda setelah dibayar.\n\n`
        msg += `*Contoh 1:* ${usedPrefix + command} https://chat.whatsapp.com/xxx\n`
        msg += `*Contoh 2:* ${usedPrefix + command} 30 https://chat.whatsapp.com/xxx`
        return m.reply(msg)
    }

    const args = text.split(' ')
    const planArg = args.find(a => packages[a.toLowerCase()])

    // Jika belum memilih paket atau paket tidak ada
    if (!planArg) {
        const rows = Object.keys(packages).map(key => {
            const pkg = packages[key]
            return {
                title: pkg.name,
                id: `${usedPrefix + command} ${key} ${linkGroup}`,
                description: `Harga: Rp ${Func.formatNumber(pkg.price)}`
            }
        })

        await conn.sendMessage(m.chat, {
            text: `*B U Y  S E W A  B O T*\n\nLink Grup terdeteksi! Silakan pilih paket sewa bot yang tersedia di bawah ini. Setelah pembayaran sukses, bot akan otomatis masuk ke grup Anda.`,
            footer: global.footer,
            buttons: [{
                buttonId: "buysewa_select",
                buttonText: {
                    displayText: "🛒 Pilih Paket Sewa"
                },
                type: 4,
                nativeFlowInfo: {
                    name: "single_select",
                    paramsJson: JSON.stringify({
                        title: "Paket Sewa Bot",
                        sections: [{
                            title: "Daftar Paket Sewa",
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

    // Proses pembelian paket sewa
    const selected = packages[planArg.toLowerCase()]
    
    conn.confirmPurchase = conn.confirmPurchase || {}
    conn.confirmPurchase[m.sender] = {
        itemID: selected.id,
        price: selected.price,
        target: m.sender,
        produk: selected.name,
        type: 'purchase',
        linkGroup: linkGroup
    }

    let msg = `*K O N F I R M A S I  P E M B A Y A R A N*\n\n`
    msg += `◦ Produk: ${selected.name}\n`
    msg += `◦ Harga: Rp ${Func.formatNumber(selected.price)}\n`
    msg += `◦ Link Grup: ${linkGroup}\n\n`
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

handler.help = ['buysewa <link>']
handler.tags = ['main']
handler.command = ['buysewa', 'sewabot', 'rentbot']
handler.register = true

export default handler

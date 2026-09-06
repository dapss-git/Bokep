const handler = async (m, { conn, text, usedPrefix, command, Func }) => {
    if (!text) return m.reply(`Masukan jumlah deposit, contoh: *${usedPrefix + command} 10000*`)
    if (isNaN(text)) return m.reply('Jumlah deposit harus berupa angka!')
    let amount = parseInt(text)
    if (amount < 1000) return m.reply('Minimal deposit adalah Rp 1.000')

    await m.reply('Sedang memproses permintaan deposit...')

    if (!conn.quickPurchase) conn.quickPurchase = {}
    if (!conn.transaction) conn.transaction = {}

    if (conn.transaction[m.sender]) {
        return m.reply('Anda masih memiliki transaksi yang belum diselesaikan. Selesaikan atau tunggu hingga kadaluarsa (5 menit).')
    }

    // Masukkan ke antrian quickPurchase untuk dieksekusi oleh task.js
    conn.quickPurchase[m.sender] = {
        chat: m.chat,
        itemID: 'deposit',
        number: m.sender,
        harga: amount,
        produk: `Deposit Saldo Rp ${Func.formatNumber(amount)}`,
        image: null,
        type: 'deposit',
        customer_name: m.pushName || m.name || 'User'
    }

    m.reply('🔄 *Memproses QRIS...*\nMohon tunggu maksimal 10 detik, bot akan mengirimkan QRIS untuk deposit Anda.')
}

handler.help = ['deposit <nominal>']
handler.tags = ['topup']
handler.command = ['deposit', 'isosaldo']
handler.register = true

export default handler

import {
    generateQris
} from '../../library/task.js'
import QRCode from 'qrcode'

const handler = async (m, {
    conn,
    text,
    usedPrefix,
    command,
    Func
}) => {
    if (!text) return m.reply(`Masukan jumlah donasi, contoh: ${usedPrefix + command} 10000`)
    if (isNaN(text)) return m.reply('Jumlah donasi harus berupa angka!')

    let amount = parseInt(text)

    await m.reply('Sedang memproses permintaan donasi...')

    if (!conn.quickPurchase) conn.quickPurchase = {}
    if (!conn.transaction) conn.transaction = {}

    if (conn.transaction[m.sender]) {
        return m.reply('Anda masih memiliki transaksi yang belum diselesaikan. Selesaikan atau batalkan transaksi sebelumnya.')
    }

    conn.quickPurchase[m.sender] = {
        chat: m.chat,
        itemID: 'donasi',
        number: m.sender,
        harga: amount,
        produk: `Donasi Dukungan Bot Rp ${Func.formatNumber(amount)}`,
        image: null,
        type: 'donasi',
        customer_name: m.pushName || m.name || 'User'
    }

    m.reply('🔄 Memproses QRIS Donasi...\nMohon tunggu maksimal 10 detik, bot akan mengirimkan QRIS untuk donasi Anda.')
}

handler.help = ['donate <nominal>', 'donasi <nominal>']
handler.command = ['donate', 'donasi']
handler.tags = ['main']
handler.register = true

export default handler
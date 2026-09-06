const handler = async (m, { conn }) => {
    if (!conn.transaction || !conn.transaction[m.sender]) {
        return m.reply('❌ Anda tidak memiliki transaksi aktif untuk dibatalkan.')
    }

    let trx = conn.transaction[m.sender]
    
    // Hapus pesan QRIS jika ada
    if (trx.msg && trx.msg.key) {
        await conn.sendMessage(m.chat, { delete: trx.msg.key }).catch(() => {})
    }

    // Hentikan timeout expired jika ada
    if (trx.expired) {
        clearTimeout(trx.expired)
    }

    delete conn.transaction[m.sender]

    m.reply(`✅ *TRANSAKSI DIBATALKAN*\n\nID: ${trx.trxId}\nProduk: ${trx.produk}\n\nBerhasil membatalkan permintaan pembayaran. Anda sekarang dapat membuat pesanan baru.`)
}

handler.help = ['batal']
handler.tags = ['topup']
handler.command = ['batal', 'cancel', 'batalkan']
handler.register = true

export default handler

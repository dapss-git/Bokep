import { OrderKuota, parseNominal } from '../../library/task.js'
import chalk from 'chalk'

const handler = async (m, { conn }) => {
    if (!conn.transaction || !conn.transaction[m.sender]) {
        return m.reply('❌ Anda tidak memiliki transaksi aktif saat ini.')
    }

    let trx = conn.transaction[m.sender]
    await m.reply('🔄 *Sedang mengecek status pembayaran Anda...*\nMohon tunggu sejenak.')

    try {
        const ok = new OrderKuota(global.orderkuota.username, global.orderkuota.token)
        
        // Cek via Kenaikan Saldo (Exclusively)
        const profile = await ok.getProfile()
        const account = profile?.account?.results || profile?.account || profile?.results?.[0]?.account || profile?.results || profile || {}
        const currentQrisBalance = Number(account.balance_qris ?? account.saldo_qris ?? account.qris_balance ?? 0)
        
        const balanceIncrease = currentQrisBalance - (trx.initial_balance || 0)
        const minExpectedIncrease = Number(trx.amount) * 0.98 // Toleransi 2% untuk MDR fee

        let isPaid = false
        if (trx.initial_balance !== undefined && balanceIncrease >= minExpectedIncrease) {
            isPaid = true
        }

        if (isPaid) {
            return m.reply('✅ *PEMBAYARAN TERDETEKSI*\n\nSistem sedang memproses pesanan Anda secara otomatis. Mohon tunggu notifikasi selanjutnya.')
        } else {
            let msg = `*🔄 STATUS: BELUM DIBAYAR*\n\n`
            msg += `◦ ID: ${trx.trxId}\n`
            msg += `◦ Produk: ${trx.produk}\n`
            msg += `◦ Nominal: Rp ${trx.amount.toLocaleString('id-ID')}\n\n`
            msg += `Pembayaran belum masuk ke sistem kami.\n\n`
            msg += `*Tips:* Pastikan Anda sudah membayar nominal yang benar (termasuk kode unik) dan tunggu sekitar 1-2 menit setelah transfer.`
            return m.reply(msg)
        }
    } catch (e) {
        console.error('[CEKSTATUS ERROR]', e)
        m.reply('❌ Terjadi kesalahan saat mengecek status. Sistem akan tetap mengecek secara otomatis setiap 10 detik.')
    }
}

handler.help = ['cekstatus']
handler.tags = ['topup']
handler.command = ['cekstatus', 'checkstatus']
handler.register = true

export default handler

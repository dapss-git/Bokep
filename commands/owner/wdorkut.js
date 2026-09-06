import { OrderKuota } from '../../library/task.js'

const handler = async (m, { conn, args, Func }) => {
    try {
        if (!args[0]) return m.reply(`🚩 Gunakan format: .wdorkut <nominal>\nContoh: .wdorkut 50000\n\n_Untuk menarik semua saldo QRIS, silakan cek nominal saldo QRIS kamu terlebih dahulu (ketik .orkut)_`)
        
        let amount = args[0].replace(/[^0-9]/g, '')
        if (!amount || parseInt(amount) < 1) return m.reply(`🚩 Nominal tidak valid!`)
        
        if (!global.orderkuota?.username || !global.orderkuota?.token) {
            return m.reply('❌ Kredensial OrderKuota belum dikonfigurasi.')
        }

        await m.reply(`⏳ Sedang memproses penarikan saldo QRIS sebesar Rp ${Func.formatNumber(amount)}...`)
        
        const ok = new OrderKuota(global.orderkuota.username, global.orderkuota.token)
        const res = await ok.withdrawalQris(amount)
        
        if (!res) {
            return m.reply('❌ Gagal menghubungi server OrderKuota.')
        }

        if (res.error_message) {
            return m.reply(`❌ Penarikan gagal:\n${res.error_message}`)
        }
        
        // Ambil profil terbaru untuk menampilkan sisa saldo
        const profile = await ok.getProfile()
        const acc = profile?.account?.results || profile?.account || profile?.results?.[0]?.account || profile?.results || profile || {}
        
        let caption = `✅ *W D  Q R I S  B E R H A S I L*\n\n`
        caption += `◦ *Nominal Withdraw:* Rp ${Func.formatNumber(amount)}\n\n`
        caption += `*S I S A  S A L D O*\n`
        caption += `◦ *Saldo Utama:* Rp ${Func.formatNumber(acc.balance || 0)}\n`
        caption += `◦ *Saldo QRIS:* Rp ${Func.formatNumber(acc.qris_balance || 0)}\n`
        
        await m.reply(caption)
        
    } catch (e) {
        console.error('[WD ORKUT]', e)
        m.reply('❌ Terjadi kesalahan sistem saat memproses withdraw.')
    }
}

handler.help = ['wdorkut', 'wdqris'].map(v => v + ' <nominal>')
handler.tags = ['owner']
handler.command = ['wd', 'wdorkut', 'wdqris', 'tarikqris']
handler.owner = true

export default handler

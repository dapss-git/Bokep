const handler = async (m, {
    usedPrefix,
    command
}) => {
    let caption = `*🎭 MESSAGE REACTION ACTIONS*\n\n`
    caption += `Anda bisa melakukan berbagai aksi cepat hanya dengan memberikan *Reaction (Emoji)* pada pesan tertentu. Berikut adalah daftarnya:\n\n`

    caption += `*── [ FITUR UMUM ] ──*\n`
    caption += `🗑️ / ❌ : *Hapus Pesan* (Pesan bot / Admin)\n`
    caption += `🔍 / 🔎 : *Cari Gambar* di Pinterest via teks\n`
    caption += `🎵 / 🎧 : *Putar Musik* dari YouTube via teks\n`
    caption += `🗣️ : *Voice Note (TTS)* membacakan teks\n`
    caption += `🌐 : *Terjemahkan* teks ke Bahasa Indonesia\n`
    caption += `🪄 : *Buat Stiker* dari Gambar/Video\n`
    caption += `🤖 : *Tanya AI* (Penjelasan isi pesan)\n`
    caption += `📥 : *Download* media dari link (TikTok/IG/dll)\n`
    caption += `📸 : *Screenshot* tampilan Website dari link\n`
    caption += `ℹ️ : *Cek Profil* & Statistik user tersebut\n`
    caption += `🔳 : *Buat QR Code* dari teks pesan\n\n`

    caption += `*── [ FITUR ADMIN ] ──*\n`
    caption += `📌 : *Pin Pesan* (Sematkan di grup)\n`
    caption += `⚠️ : *Warn User* (Berikan poin peringatan)\n`
    caption += `🦶 : *Kick User* (Keluarkan member)\n\n`

    caption += `_Cukup tekan lama pada pesan dan pilih emojinya!_`

    await m.reply(caption)
}

handler.help = ['listreact', 'reactlist']
handler.tags = ['info']
handler.command = /^(listreact|reactlist|helpreact)$/i
handler.register = true
export default handler
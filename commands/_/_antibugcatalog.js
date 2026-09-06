export async function before(m, { conn, isAdmin, isBotAdmin, group }) {
	if (!m.isGroup) return true
	if (m.fromMe) return true
	
	const chatData = global.db.data.chats[m.chat] || {}
	const isEnabled = group?.antibugcatalog || chatData.antibugcatalog
	
	if (!isEnabled) return true
	if (!m.message) return true

	const rawMessage = JSON.stringify(m.message).toLowerCase()
	
	// Cek kriteria bug catalog
	const isCatalogBug = rawMessage.includes('catalog_message') || 
	                     rawMessage.includes('biz_native_flow') ||
	                     rawMessage.includes('native_flow_message') && rawMessage.includes('catalog')

	if (!isCatalogBug) return true

	// Log ke terminal jika terdeteksi bug
	console.log(`[ANTIBUG] Terdeteksi Bug Catalog dari: ${m.sender} di ${m.chat}`)

	// Jika pengirim Admin, bot hanya menghapus pesannya saja (opsional)
	if (isAdmin) {
		console.log(`[ANTIBUG] Pengirim adalah Admin. Hanya menghapus pesan.`)
		try {
			await conn.sendMessage(m.chat, { delete: m.key })
		} catch {}
		return true
	}
	
	if (!isBotAdmin) {
		console.log(`[ANTIBUG] Bug terdeteksi tapi bot bukan admin.`)
		return true
	}

	// EKSEKUSI
	try {
		// 1. Hapus Pesan Bug
		await conn.sendMessage(m.chat, { delete: m.key })
		
		// 2. Keluarkan Pengirim
		await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
		
		// 3. Beri Peringatan
		await conn.sendMessage(m.chat, {
			text: `🛡️ *ANTIBUG CATALOG DETECTED*\n\nSistem mendeteksi percobaan serangan bug catalog dari @${m.sender.split('@')[0]}.\n\n*Tindakan:* Pesan dihapus & Pengirim dikeluarkan.`,
			mentions: [m.sender]
		})
	} catch (e) {
		console.error(`[ANTIBUG-ERROR]`, e.message)
	}

	return false
}

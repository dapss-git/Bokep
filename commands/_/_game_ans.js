import similarity from 'similarity'

const threshold = 0.72

export async function before(m, { conn }) {
    if (m.isBaileys || m.fromMe) return true
    
    // Handle Family 100
    if (conn.family100 && m.chat in conn.family100) {
        const room = conn.family100[m.chat]
        if (!m.quoted || !m.quoted.fromMe) return true
        
        const soalId = room[0]?.key?.id
        const hintId = room[5]?.key?.id
        
        const isReplyValid = m.quoted.id === soalId || (hintId && m.quoted.id === hintId)
        if (!isReplyValid) return true
        
        if (/^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/.test(m.text?.trim())) return true
        
        const botJidKey = conn?.user?.jid || conn?.user?.id || 'bot'
        const setting = global.db.data.settings[botJidKey] || {}
        if (setting.composing) await conn.sendPresenceUpdate('composing', m.chat)
        if (setting.autoread) await conn.readMessages([m.key])
        
        const json = room[1]
        const jawaban = json.jawaban.map(j => j.toLowerCase().trim())
        const teks = m.text.toLowerCase().trim()
        
        // Check if answer matches any of the correct answers
        const isCorrect = jawaban.some(j => teks === j || similarity(teks, j) >= threshold)
        
        if (isCorrect) {
            const correctAnswer = jawaban.find(j => teks === j || similarity(teks, j) >= threshold)
            const remainingAnswers = json.jawaban.filter(j => j.toLowerCase() !== correctAnswer)
            
            global.db.data.users[m.sender].money += room[2]
            global.db.data.users[m.sender].limit += 1
            
            if (remainingAnswers.length > 0) {
                m.reply(`*🎉 BENAR! 🎉*\n\nJawaban kamu: *${correctAnswer}*\nMasih ada ${remainingAnswers.length} jawaban lagi!\n\n+${room[2]} 💰Money\n+1 🎫Limit`)
                // Update room to track remaining answers
                room[1].jawaban = remainingAnswers
            } else {
                m.reply(`*🎉 SELAMAT! SEMUA JAWABAN BENAR! 🎉*\n\n+${room[2]} 💰Money\n+1 🎫Limit`)
                clearTimeout(room[4])
                delete conn.family100[m.chat]
            }
        } else if (--room[3] == 0) {
            clearTimeout(room[4])
            delete conn.family100[m.chat]
            const allAnswers = json.jawaban.join(', ')
            conn.reply(m.chat, `*Kesempatan habis!*\nJawaban: *${allAnswers}*`, m)
        } else {
            m.reply(`*❌ Jawaban Salah!*\nMasih ada ${room[3]} kesempatan`)
        }
        return true
    }
    
    // Handle Tebak Gambar
    if (conn.tebakgambar && m.chat in conn.tebakgambar) {
        const room = conn.tebakgambar[m.chat]
        if (!m.quoted || !m.quoted.fromMe) return true
        
        const soalId = room[0]?.key?.id
        const hintId = room[5]?.key?.id
        
        const isReplyValid = m.quoted.id === soalId || (hintId && m.quoted.id === hintId)
        if (!isReplyValid) return true
        
        if (/^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/.test(m.text?.trim())) return true
        
        const botJidKey = conn?.user?.jid || conn?.user?.id || 'bot'
        const setting = global.db.data.settings[botJidKey] || {}
        if (setting.composing) await conn.sendPresenceUpdate('composing', m.chat)
        if (setting.autoread) await conn.readMessages([m.key])
        
        const json = room[1]
        const jawaban = json.jawaban.toLowerCase().trim()
        const teks = m.text.toLowerCase().trim()
        
        if (teks === jawaban) {
            global.db.data.users[m.sender].money += room[2]
            global.db.data.users[m.sender].limit += 1
            m.reply(`*🎉BENAR!🎉*\n+${room[2]} 💰Money\n+1 🎫Limit`)
            clearTimeout(room[4])
            delete conn.tebakgambar[m.chat]
        } else if (similarity(teks, jawaban) >= threshold) {
            m.reply(`*Dikit Lagi!*`)
        } else if (--room[3] == 0) {
            clearTimeout(room[4])
            delete conn.tebakgambar[m.chat]
            conn.reply(m.chat, `*Kesempatan habis!*\nJawaban: *${json.jawaban}*`, m)
        } else {
            m.reply(`*Jawaban Salah!*\nMasih ada ${room[3]} kesempatan`)
        }
        return true
    }
    
    // Handle Tebak Bendera
    if (conn.tebakbendera && m.chat in conn.tebakbendera) {
        const room = conn.tebakbendera[m.chat]
        if (!m.quoted || !m.quoted.fromMe) return true
        
        const soalId = room[0]?.key?.id
        const hintId = room[5]?.key?.id
        
        const isReplyValid = m.quoted.id === soalId || (hintId && m.quoted.id === hintId)
        if (!isReplyValid) return true
        
        if (/^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/.test(m.text?.trim())) return true
        
        const botJidKey = conn?.user?.jid || conn?.user?.id || 'bot'
        const setting = global.db.data.settings[botJidKey] || {}
        if (setting.composing) await conn.sendPresenceUpdate('composing', m.chat)
        if (setting.autoread) await conn.readMessages([m.key])
        
        const json = room[1]
        const jawaban = json.name.toLowerCase().trim()
        const teks = m.text.toLowerCase().trim()
        
        if (teks === jawaban) {
            global.db.data.users[m.sender].money += room[2]
            global.db.data.users[m.sender].limit += 1
            m.reply(`*🎉BENAR!🎉*\n+${room[2]} 💰Money\n+1 🎫Limit`)
            clearTimeout(room[4])
            delete conn.tebakbendera[m.chat]
        } else if (similarity(teks, jawaban) >= threshold) {
            m.reply(`*Dikit Lagi!*`)
        } else if (--room[3] == 0) {
            clearTimeout(room[4])
            delete conn.tebakbendera[m.chat]
            conn.reply(m.chat, `*Kesempatan habis!*\nJawaban: *${json.name}*`, m)
        } else {
            m.reply(`*Jawaban Salah!*\nMasih ada ${room[3]} kesempatan`)
        }
        return true
    }
    
    // Handle Tebak Kata
    if (conn.tebakkata && m.chat in conn.tebakkata) {
        const room = conn.tebakkata[m.chat]
        if (!m.quoted || !m.quoted.fromMe) return true
        
        const soalId = room[0]?.key?.id
        const hintId = room[5]?.key?.id
        
        const isReplyValid = m.quoted.id === soalId || (hintId && m.quoted.id === hintId)
        if (!isReplyValid) return true
        
        if (/^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/.test(m.text?.trim())) return true
        
        const botJidKey = conn?.user?.jid || conn?.user?.id || 'bot'
        const setting = global.db.data.settings[botJidKey] || {}
        if (setting.composing) await conn.sendPresenceUpdate('composing', m.chat)
        if (setting.autoread) await conn.readMessages([m.key])
        
        const json = room[1]
        const jawaban = json.jawaban.toLowerCase().trim()
        const teks = m.text.toLowerCase().trim()
        
        if (teks === jawaban) {
            global.db.data.users[m.sender].money += room[2]
            global.db.data.users[m.sender].limit += 1
            m.reply(`*🎉BENAR!🎉*\n+${room[2]} 💰Money\n+1 🎫Limit`)
            clearTimeout(room[4])
            delete conn.tebakkata[m.chat]
        } else if (similarity(teks, jawaban) >= threshold) {
            m.reply(`*Dikit Lagi!*`)
        } else if (--room[3] == 0) {
            clearTimeout(room[4])
            delete conn.tebakkata[m.chat]
            conn.reply(m.chat, `*Kesempatan habis!*\nJawaban: *${json.jawaban}*`, m)
        } else {
            m.reply(`*Jawaban Salah!*\nMasih ada ${room[3]} kesempatan`)
        }
        return true
    }
    
    // Handle Asah Otak
    if (conn.asahotak && m.chat in conn.asahotak) {
        const room = conn.asahotak[m.chat]
        if (!m.quoted || !m.quoted.fromMe) return true
        
        const soalId = room[0]?.key?.id
        const hintId = room[5]?.key?.id
        
        const isReplyValid = m.quoted.id === soalId || (hintId && m.quoted.id === hintId)
        if (!isReplyValid) return true
        
        if (/^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/.test(m.text?.trim())) return true
        
        const botJidKey = conn?.user?.jid || conn?.user?.id || 'bot'
        const setting = global.db.data.settings[botJidKey] || {}
        if (setting.composing) await conn.sendPresenceUpdate('composing', m.chat)
        if (setting.autoread) await conn.readMessages([m.key])
        
        const json = room[1]
        const jawaban = json.jawaban.toLowerCase().trim()
        const teks = m.text.toLowerCase().trim()
        
        if (teks === jawaban) {
            global.db.data.users[m.sender].money += room[2]
            global.db.data.users[m.sender].limit += 1
            m.reply(`*🎉BENAR!🎉*\n+${room[2]} 💰Money\n+1 🎫Limit`)
            clearTimeout(room[4])
            delete conn.asahotak[m.chat]
        } else if (similarity(teks, jawaban) >= threshold) {
            m.reply(`*Dikit Lagi!*`)
        } else if (--room[3] == 0) {
            clearTimeout(room[4])
            delete conn.asahotak[m.chat]
            conn.reply(m.chat, `*Kesempatan habis!*\nJawaban: *${json.jawaban}*`, m)
        } else {
            m.reply(`*Jawaban Salah!*\nMasih ada ${room[3]} kesempatan`)
        }
        return true
    }
    
    // Handle Siapakah Aku
    if (conn.siapakahaku && m.chat in conn.siapakahaku) {
        const room = conn.siapakahaku[m.chat]
        if (!m.quoted || !m.quoted.fromMe) return true

        const soalId = room[0]?.key?.id
        const hintId = room[5]?.key?.id

        const isReplyValid = m.quoted.id === soalId || (hintId && m.quoted.id === hintId)
        if (!isReplyValid) return true

        if (/^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/.test(m.text?.trim())) return true

        const botJidKey = conn?.user?.jid || conn?.user?.id || 'bot'
        const setting = global.db.data.settings[botJidKey] || {}
        if (setting.composing) await conn.sendPresenceUpdate('composing', m.chat)
        if (setting.autoread) await conn.readMessages([m.key])

        const json = room[1]
        const jawaban = json.jawaban.toLowerCase().trim()
        const teks = m.text.toLowerCase().trim()

        if (teks === jawaban) {
            global.db.data.users[m.sender].money += room[2]
            global.db.data.users[m.sender].limit += 1
            m.reply(`*🎉BENAR!🎉*\n+${room[2]} 💰Money\n+1 🎫Limit`)
            clearTimeout(room[4])
            delete conn.siapakahaku[m.chat]
        } else if (similarity(teks, jawaban) >= threshold) {
            m.reply(`*Dikit Lagi!*`)
        } else if (--room[3] == 0) {
            clearTimeout(room[4])
            delete conn.siapakahaku[m.chat]
            conn.reply(m.chat, `*Kesempatan habis!*\nJawaban: *${json.jawaban}*`, m)
        } else {
            m.reply(`*Jawaban Salah!*\nMasih ada ${room[3]} kesempatan`)
        }
        return true
    }

    // Handle Tebak Game
    if (conn.tebakgame && m.chat in conn.tebakgame) {
        const room = conn.tebakgame[m.chat]
        if (!m.quoted || !m.quoted.fromMe) return true

        const soalId = room[0]?.key?.id
        const hintId = room[5]?.key?.id

        const isReplyValid = m.quoted.id === soalId || (hintId && m.quoted.id === hintId)
        if (!isReplyValid) return true

        if (/^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/.test(m.text?.trim())) return true

        const botJidKey = conn?.user?.jid || conn?.user?.id || 'bot'
        const setting = global.db.data.settings[botJidKey] || {}
        if (setting.composing) await conn.sendPresenceUpdate('composing', m.chat)
        if (setting.autoread) await conn.readMessages([m.key])

        const json = room[1]
        const jawaban = json.jawaban.toLowerCase().trim()
        const teks = m.text.toLowerCase().trim()

        if (teks === jawaban) {
            global.db.data.users[m.sender].money += room[2]
            global.db.data.users[m.sender].limit += 1
            m.reply(`*🎉BENAR!🎉*\n+${room[2]} 💰Money\n+1 🎫Limit`)
            clearTimeout(room[4])
            delete conn.tebakgame[m.chat]
        } else if (similarity(teks, jawaban) >= threshold) {
            m.reply(`*Dikit Lagi!*`)
        } else if (--room[3] == 0) {
            clearTimeout(room[4])
            delete conn.tebakgame[m.chat]
            conn.reply(m.chat, `*Kesempatan habis!*\nJawaban: *${json.jawaban}*`, m)
        } else {
            m.reply(`*Jawaban Salah!*\nMasih ada ${room[3]} kesempatan`)
        }
        return true
    }

    // Handle Tebak Kimia
    if (conn.tebakkimia && m.chat in conn.tebakkimia) {
        const room = conn.tebakkimia[m.chat]
        if (!m.quoted || !m.quoted.fromMe) return true

        const soalId = room[0]?.key?.id
        const hintId = room[5]?.key?.id

        const isReplyValid = m.quoted.id === soalId || (hintId && m.quoted.id === hintId)
        if (!isReplyValid) return true

        if (/^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/.test(m.text?.trim())) return true

        const botJidKey = conn?.user?.jid || conn?.user?.id || 'bot'
        const setting = global.db.data.settings[botJidKey] || {}
        if (setting.composing) await conn.sendPresenceUpdate('composing', m.chat)
        if (setting.autoread) await conn.readMessages([m.key])

        const json = room[1]
        const jawaban = json.lambang.toLowerCase().trim()
        const teks = m.text.toLowerCase().trim()

        if (teks === jawaban) {
            global.db.data.users[m.sender].money += room[2]
            global.db.data.users[m.sender].limit += 1
            m.reply(`*🎉BENAR!🎉*\n+${room[2]} 💰Money\n+1 🎫Limit`)
            clearTimeout(room[4])
            delete conn.tebakkimia[m.chat]
        } else if (similarity(teks, jawaban) >= threshold) {
            m.reply(`*Dikit Lagi!*`)
        } else if (--room[3] == 0) {
            clearTimeout(room[4])
            delete conn.tebakkimia[m.chat]
            conn.reply(m.chat, `*Kesempatan habis!*\nJawaban: *${json.lambang}*`, m)
        } else {
            m.reply(`*Jawaban Salah!*\nMasih ada ${room[3]} kesempatan`)
        }
        return true
    }

    // Handle Tebak Lagu
    if (conn.tebaklagu && m.chat in conn.tebaklagu) {
        const room = conn.tebaklagu[m.chat]
        if (!m.quoted || !m.quoted.fromMe) return true

        const soalId = room[0]?.key?.id
        const hintId = room[5]?.key?.id

        const isReplyValid = m.quoted.id === soalId || (hintId && m.quoted.id === hintId)
        if (!isReplyValid) return true

        if (/^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/.test(m.text?.trim())) return true

        const botJidKey = conn?.user?.jid || conn?.user?.id || 'bot'
        const setting = global.db.data.settings[botJidKey] || {}
        if (setting.composing) await conn.sendPresenceUpdate('composing', m.chat)
        if (setting.autoread) await conn.readMessages([m.key])

        const json = room[1]
        const jawaban = json.judul.toLowerCase().trim()
        const teks = m.text.toLowerCase().trim()

        if (teks === jawaban) {
            global.db.data.users[m.sender].money += room[2]
            global.db.data.users[m.sender].limit += 1
            m.reply(`*🎉BENAR!🎉*\n+${room[2]} 💰Money\n+1 🎫Limit`)
            clearTimeout(room[4])
            delete conn.tebaklagu[m.chat]
        } else if (similarity(teks, jawaban) >= threshold) {
            m.reply(`*Dikit Lagi!*`)
        } else if (--room[3] == 0) {
            clearTimeout(room[4])
            delete conn.tebaklagu[m.chat]
            conn.reply(m.chat, `*Kesempatan habis!*\nJawaban: *${json.judul}*`, m)
        } else {
            m.reply(`*Jawaban Salah!*\nMasih ada ${room[3]} kesempatan`)
        }
        return true
    }

    // Handle Tebak Lirik
    if (conn.tebaklirik && m.chat in conn.tebaklirik) {
        const room = conn.tebaklirik[m.chat]
        if (!m.quoted || !m.quoted.fromMe) return true

        const soalId = room[0]?.key?.id
        const hintId = room[5]?.key?.id

        const isReplyValid = m.quoted.id === soalId || (hintId && m.quoted.id === hintId)
        if (!isReplyValid) return true

        if (/^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/.test(m.text?.trim())) return true

        const botJidKey = conn?.user?.jid || conn?.user?.id || 'bot'
        const setting = global.db.data.settings[botJidKey] || {}
        if (setting.composing) await conn.sendPresenceUpdate('composing', m.chat)
        if (setting.autoread) await conn.readMessages([m.key])

        const json = room[1]
        const jawaban = json.jawaban.toLowerCase().trim()
        const teks = m.text.toLowerCase().trim()

        if (teks === jawaban) {
            global.db.data.users[m.sender].money += room[2]
            global.db.data.users[m.sender].limit += 1
            m.reply(`*🎉BENAR!🎉*\n+${room[2]} 💰Money\n+1 🎫Limit`)
            clearTimeout(room[4])
            delete conn.tebaklirik[m.chat]
        } else if (similarity(teks, jawaban) >= threshold) {
            m.reply(`*Dikit Lagi!*`)
        } else if (--room[3] == 0) {
            clearTimeout(room[4])
            delete conn.tebaklirik[m.chat]
            conn.reply(m.chat, `*Kesempatan habis!*\nJawaban: *${json.jawaban}*`, m)
        } else {
            m.reply(`*Jawaban Salah!*\nMasih ada ${room[3]} kesempatan`)
        }
        return true
    }

    // Handle Tebak Logo
    if (conn.tebaklogo && m.chat in conn.tebaklogo) {
        const room = conn.tebaklogo[m.chat]
        if (!m.quoted || !m.quoted.fromMe) return true

        const soalId = room[0]?.key?.id
        const hintId = room[5]?.key?.id

        const isReplyValid = m.quoted.id === soalId || (hintId && m.quoted.id === hintId)
        if (!isReplyValid) return true

        if (/^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/.test(m.text?.trim())) return true

        const botJidKey = conn?.user?.jid || conn?.user?.id || 'bot'
        const setting = global.db.data.settings[botJidKey] || {}
        if (setting.composing) await conn.sendPresenceUpdate('composing', m.chat)
        if (setting.autoread) await conn.readMessages([m.key])

        const json = room[1]
        const jawaban = json.jawaban.toLowerCase().trim()
        const teks = m.text.toLowerCase().trim()

        if (teks === jawaban) {
            global.db.data.users[m.sender].money += room[2]
            global.db.data.users[m.sender].limit += 1
            m.reply(`*🎉BENAR!🎉*\n+${room[2]} 💰Money\n+1 🎫Limit`)
            clearTimeout(room[4])
            delete conn.tebaklogo[m.chat]
        } else if (similarity(teks, jawaban) >= threshold) {
            m.reply(`*Dikit Lagi!*`)
        } else if (--room[3] == 0) {
            clearTimeout(room[4])
            delete conn.tebaklogo[m.chat]
            conn.reply(m.chat, `*Kesempatan habis!*\nJawaban: *${json.jawaban}*`, m)
        } else {
            m.reply(`*Jawaban Salah!*\nMasih ada ${room[3]} kesempatan`)
        }
        return true
    }

    // Handle Tebak Makanan
    if (conn.tebakmakanan && m.chat in conn.tebakmakanan) {
        const room = conn.tebakmakanan[m.chat]
        if (!m.quoted || !m.quoted.fromMe) return true

        const soalId = room[0]?.key?.id
        const hintId = room[5]?.key?.id

        const isReplyValid = m.quoted.id === soalId || (hintId && m.quoted.id === hintId)
        if (!isReplyValid) return true

        if (/^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/.test(m.text?.trim())) return true

        const botJidKey = conn?.user?.jid || conn?.user?.id || 'bot'
        const setting = global.db.data.settings[botJidKey] || {}
        if (setting.composing) await conn.sendPresenceUpdate('composing', m.chat)
        if (setting.autoread) await conn.readMessages([m.key])

        const json = room[1]
        const jawaban = json.jawaban.toLowerCase().trim()
        const teks = m.text.toLowerCase().trim()

        if (teks === jawaban) {
            global.db.data.users[m.sender].money += room[2]
            global.db.data.users[m.sender].limit += 1
            m.reply(`*🎉BENAR!🎉*\n+${room[2]} 💰Money\n+1 🎫Limit`)
            clearTimeout(room[4])
            delete conn.tebakmakanan[m.chat]
        } else if (similarity(teks, jawaban) >= threshold) {
            m.reply(`*Dikit Lagi!*`)
        } else if (--room[3] == 0) {
            clearTimeout(room[4])
            delete conn.tebakmakanan[m.chat]
            conn.reply(m.chat, `*Kesempatan habis!*\nJawaban: *${json.jawaban}*`, m)
        } else {
            m.reply(`*Jawaban Salah!*\nMasih ada ${room[3]} kesempatan`)
        }
        return true
    }

    // Handle Tebak Tebakan
    if (conn.tebaktebakan && m.chat in conn.tebaktebakan) {
        const room = conn.tebaktebakan[m.chat]
        if (!m.quoted || !m.quoted.fromMe) return true

        const soalId = room[0]?.key?.id
        const hintId = room[5]?.key?.id

        const isReplyValid = m.quoted.id === soalId || (hintId && m.quoted.id === hintId)
        if (!isReplyValid) return true

        if (/^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/.test(m.text?.trim())) return true

        const botJidKey = conn?.user?.jid || conn?.user?.id || 'bot'
        const setting = global.db.data.settings[botJidKey] || {}
        if (setting.composing) await conn.sendPresenceUpdate('composing', m.chat)
        if (setting.autoread) await conn.readMessages([m.key])

        const json = room[1]
        const jawaban = json.jawaban.toLowerCase().trim()
        const teks = m.text.toLowerCase().trim()

        if (teks === jawaban) {
            global.db.data.users[m.sender].money += room[2]
            global.db.data.users[m.sender].limit += 1
            m.reply(`*🎉BENAR!🎉*\n+${room[2]} 💰Money\n+1 🎫Limit`)
            clearTimeout(room[4])
            delete conn.tebaktebakan[m.chat]
        } else if (similarity(teks, jawaban) >= threshold) {
            m.reply(`*Dikit Lagi!*`)
        } else if (--room[3] == 0) {
            clearTimeout(room[4])
            delete conn.tebaktebakan[m.chat]
            conn.reply(m.chat, `*Kesempatan habis!*\nJawaban: *${json.jawaban}*`, m)
        } else {
            m.reply(`*Jawaban Salah!*\nMasih ada ${room[3]} kesempatan`)
        }
        return true
    }

    // Handle Cak Lontong
    if (conn.caklontong && m.chat in conn.caklontong) {
        const room = conn.caklontong[m.chat]
        if (!m.quoted || !m.quoted.fromMe) return true

        const soalId = room[0]?.key?.id
        const hintId = room[5]?.key?.id

        const isReplyValid = m.quoted.id === soalId || (hintId && m.quoted.id === hintId)
        if (!isReplyValid) return true

        if (/^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]/.test(m.text?.trim())) return true

        const botJidKey = conn?.user?.jid || conn?.user?.id || 'bot'
        const setting = global.db.data.settings[botJidKey] || {}
        if (setting.composing) await conn.sendPresenceUpdate('composing', m.chat)
        if (setting.autoread) await conn.readMessages([m.key])

        const json = room[1]
        const jawaban = json.jawaban.toLowerCase().trim()
        const teks = m.text.toLowerCase().trim()

        if (teks === jawaban) {
            global.db.data.users[m.sender].money += room[2]
            global.db.data.users[m.sender].limit += 1
            m.reply(`*🎉BENAR!🎉*\n+${room[2]} 💰Money\n+1 🎫Limit\n💡 ${json.deskripsi}`)
            clearTimeout(room[4])
            delete conn.caklontong[m.chat]
        } else if (similarity(teks, jawaban) >= threshold) {
            m.reply(`*Dikit Lagi!*`)
        } else if (--room[3] == 0) {
            clearTimeout(room[4])
            delete conn.caklontong[m.chat]
            conn.reply(m.chat, `*Kesempatan habis!*\nJawaban: *${json.jawaban}*\n💡 ${json.deskripsi}`, m)
        } else {
            m.reply(`*Jawaban Salah!*\nMasih ada ${room[3]} kesempatan`)
        }
        return true
    }

    return true
}

export const exp = 0



let handler = async (m, {
    conn
}) => {
    let user = global.db.data.users

    if (!user[m.sender]) {
        return m.reply("Kamu belum terdaftar di database")
    }

    let pasangan = user[m.sender].tinggalBareng

    if (!pasangan) {
        return m.reply("Kamu tidak sedang tinggal bareng dengan siapa pun!")
    }

    user[m.sender].tinggalBareng = ""
    user[m.sender].rumahTinggal = ""
    
    if (user[pasangan]) {
        user[pasangan].tinggalBareng = ""
        user[pasangan].rumahTinggal = ""
    }

    await m.reply(
        `🏠 @${m.sender.split("@")[0]} memutuskan untuk berhenti tinggal bareng dengan @${pasangan.split("@")[0]}.`,
        false, {
            mentions: [m.sender, pasangan]
        }
    )
}

handler.help = ["keluarrumah"]
handler.tags = ["rpg"]
handler.command = /^(keluarrumah|out)$/i

handler.register = true

export default handler
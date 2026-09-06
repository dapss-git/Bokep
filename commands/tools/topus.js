import { toAudio } from '../../library/converter.js'

let handler = async (m, { conn, text, args }) => {
  if (!m.quoted && !args[0]) return m.reply("Balas audio atau kirim link audio untuk dikonversi.");

  try {
    let buffer;
    let mime = '';
    if (m.quoted && m.quoted.download) {
      // Check if quoted message is audio/video
      const quotedType = m.quoted.type || "";
      mime = m.quoted.msg?.mimetype || m.quoted.mimetype || '';
      if (!/audio|video|ptt|voice/.test(quotedType) && !mime) {
        return m.reply("Balas audio/video yang ingin dikonversi ke Opus.");
      }
      buffer = await m.quoted.download();
    } else if (args[0]) {
      const res = await fetch(args[0]);
      buffer = await res.arrayBuffer();
      mime = res.headers.get('content-type') || '';
    } else {
      return m.reply("Balas audio/video atau kirim link audio untuk dikonversi.");
    }

    if (!buffer) {
      return m.reply("Gagal mendownload media. Pastikan pesan yang dibalas adalah audio/video.");
    }

    await global.loading(m, conn)

    const ext = mime.split('/')[1] || 'mp4'
    const { data, delete: deleteFile } = await toAudio(Buffer.from(buffer), ext)

    await conn.sendFile(m.chat, data, 'audio.opus', '', m, { ptt: true, mimetype: 'audio/ogg; codecs=opus' });
    await m.reply("✅ Audio berhasil dikirim!");

    await deleteFile()
  } catch (e) {
    console.error(e);
    await m.reply(`❌ Gagal memproses audio: ${e?.message || e}`);
  } finally {
    global.loading(m, conn, true)
  }
};

handler.command = ["topus", "toopus"];
handler.tags = ["tools"];
handler.description = "Convert audio/voice ke opus dan kirim ke chat ini.";
handler.register = true;
handler.limit = true;

export default handler;

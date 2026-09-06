import axios from "axios";

class TeraboxDownloader {
  constructor() {
    this.cookies = ""
    this.client = axios.create({
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "accept": "application/json",
        "referer": "https://1024teradownloader.com/",
        "origin": "https://1024teradownloader.com",
      }
    })
  }

  async getCookies() {
    try {
      const home = await this.client.get("https://1024teradownloader.com/")
      if (home.headers['set-cookie']) {
        this.cookies = home.headers['set-cookie'].map(c => c.split(';')[0]).join('; ')
      }
    } catch (e) {
      console.error("Gagal mendapatkan cookies dari 1024teradownloader.com:", e.message)
    }
    return this.cookies
  }

  async search(teraboxUrl) {
    if (!teraboxUrl) throw new Error("URL tidak boleh kosong")
    await this.getCookies()

    const res = await this.client.post(
      "https://1024teradownloader.com/api/stream",
      { url: teraboxUrl },
      {
        headers: {
          "cookie": this.cookies,
          "content-type": "application/json",
          "accept": "application/json",
          "referer": "https://1024teradownloader.com/",
        }
      }
    )

    if (res.data.status === "success") {
      return {
        error: false,
        data: res.data.list.map(item => ({
          file_name: item.name,
          thumbnail: item.thumbnail || "",
          download_url: item.normal_dlink || "",
          stream_url: item.fast_stream_url || item.normal_dlink || "",
          file_size: item.size_formatted,
          file_size_bytes: item.size,
          share_url: teraboxUrl,
          ...item
        }))
      }
    } else {
      return {
        error: true,
        message: res.data.message || res.data.error_detail || "Failed to fetch file details."
      }
    }
  }
}

const terabox = new TeraboxDownloader();

let handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {
    if (!text) return m.reply(`Masukkan URL Terabox!\n\nContoh: ${usedPrefix}${command} https://1024terabox.com/s/1UJO0j5JHDZY4JuhSo7sELw`);

    try {
        if (global.loading) await global.loading(m, conn);
        else await m.react('⏳');

        const result = await terabox.search(text);

        if (!result.error && result.data.length > 0) {
            for (const file of result.data) {
                const {
                    file_name,
                    file_size,
                    download_url
                } = file;

                let caption = `*Terabox Downloader*\n\n`;
                caption += `*File Name:* ${file_name}\n`;
                caption += `*File Size:* ${file_size}\n\n`;
                caption += `_Mengirim file..._`;

                await conn.sendMessage(m.chat, {
                    text: caption,
                    quoted: m
                });

                const ext = file_name.split('.').pop().toLowerCase();
                const imageExt = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
                const videoExt = ['mp4', 'mkv', 'avi', 'mov'];
                const audioExt = ['mp3', 'wav', 'ogg', 'm4a'];

                let message = {};

                if (imageExt.includes(ext)) {
                    message = {
                        image: {
                            url: download_url
                        },
                        caption: file_name
                    };
                } else if (videoExt.includes(ext)) {
                    message = {
                        video: {
                            url: download_url
                        },
                        caption: file_name
                    };
                } else if (audioExt.includes(ext)) {
                    message = {
                        audio: {
                            url: download_url
                        },
                        mimetype: 'audio/mpeg',
                        fileName: file_name
                    };
                } else {
                    message = {
                        document: {
                            url: download_url
                        },
                        fileName: file_name,
                        mimetype: 'application/octet-stream'
                    };
                }

                await conn.sendMessage(m.chat, message, {
                    quoted: m
                });
            }

            if (global.loading) await global.loading(m, conn, true);
            else await m.react('✅');

        } else {
            if (global.loading) await global.loading(m, conn, true);
            else await m.react('❌');
            m.reply(`Terjadi kesalahan: ${result.message || 'Gagal mengunduh dari Terabox.'}`);
        }
    } catch (error) {
        if (global.loading) await global.loading(m, conn, true);
        else await m.react('❌');
        console.error(error);
        m.reply(`Terjadi kesalahan saat memproses permintaan: ${error.message}`);
    }
};

handler.help = ["terabox <url>"];
handler.tags = ["downloader"];
handler.command = /^(terabox|tb)$/i;
handler.description = "Download files from Terabox.";
handler.register = true;
handler.limit = true;

export default handler;
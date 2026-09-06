let AdmZip;
try {
    const mod = await import('adm-zip');
    AdmZip = mod.default || mod;
} catch {
    try {
        const mod = await import('/data/data/com.termux/files/home/node_modules/adm-zip/adm-zip.js');
        AdmZip = mod.default || mod;
    } catch (e) {
        console.warn('[deploy] AdmZip fallback: adm-zip module not found directly');
    }
}

const getTokens = () => {
    const ghToken = (global.GITHUB_TOKEN || global.deploy?.github?.token || "").trim();
    const ghUser = (global.GITHUB_USER || global.deploy?.github?.user || "").trim();
    const vcToken = (global.VERCEL_TOKEN || global.deploy?.vercel?.token || "").trim();
    return {
        ghToken,
        ghUser,
        vcToken
    };
};

const getHeaders = () => {
    const {
        ghToken,
        vcToken
    } = getTokens();
    return {
        ghHeaders: {
            "Authorization": `Bearer ${ghToken}`,
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "WhatsApp-Bot"
        },
        vcHeaders: {
            "Authorization": `Bearer ${vcToken}`,
            "Content-Type": "application/json"
        }
    };
};

const uploadGH = async (repo, filePath, base64Content) => {
    const {
        ghUser
    } = getTokens();
    const {
        ghHeaders
    } = getHeaders();
    const cleanPath = filePath.replace(/^\/+/, '');
    const url = `https://api.github.com/repos/${ghUser}/${repo}/contents/${cleanPath}`;

    let body = {
        message: `Upload/Edit ${cleanPath} via Bot`,
        content: base64Content
    };

    let res = await fetch(url, {
        method: 'PUT',
        headers: ghHeaders,
        body: JSON.stringify(body)
    });

    if (res.status === 422 || res.status === 409) {
        let getRes = await fetch(url, {
            headers: ghHeaders
        });
        if (getRes.ok) {
            let getJson = await getRes.json();
            if (getJson.sha) {
                body.sha = getJson.sha;
                res = await fetch(url, {
                    method: 'PUT',
                    headers: ghHeaders,
                    body: JSON.stringify(body)
                });
            }
        }
    }
    return res.ok;
};

let handler = async (m, {
    conn,
    text,
    args,
    usedPrefix,
    command
}) => {
    const cmd = command.toLowerCase();
    const {
        ghToken,
        ghUser,
        vcToken
    } = getTokens();
    const {
        ghHeaders,
        vcHeaders
    } = getHeaders();

    if (!ghToken || !ghUser) {
        return m.reply(`❌ Token atau Username GitHub belum diatur di settings.js!\nSilakan atur global.deploy.github di settings.js.`);
    }

    const waitMsg = async (txt) => {
        return await conn.sendMessage(m.chat, {
            text: `⏳ ${txt}`
        }, {
            quoted: m
        });
    };

    const editMsg = async (msgObj, txt) => {
        try {
            return await conn.sendMessage(m.chat, {
                text: txt,
                edit: msgObj.key
            });
        } catch {
            return await m.reply(txt);
        }
    };

    try {
        if (cmd === 'addrepo') {
            if (!text) return m.reply(`📌 Masukkan nama repo!\nContoh: ${usedPrefix + command} web-dafa`);

            const repoName = text.trim().replace(/\s+/g, '-');
            let load = await waitMsg(`Sedang membuat repositori ${repoName} di GitHub...`);

            let res = await fetch(`https://api.github.com/user/repos`, {
                method: 'POST',
                headers: ghHeaders,
                body: JSON.stringify({
                    name: repoName,
                    private: false,
                    auto_init: true
                })
            });
            let json = await res.json();

            if (res.ok) {
                await editMsg(load, `✅ Repositori berhasil dibuat!\n📦 Nama: ${json.name}\n🔗 Link: ${json.html_url}\n🌿 Branch: ${json.default_branch || 'main'}`);
            } else {
                await editMsg(load, `❌ Gagal membuat repo: ${json.message || 'Error tidak diketahui'}`);
            }
        }

        if (cmd === 'listrepo' || cmd === 'listrepositori') {
            let load = await waitMsg("Mengambil daftar repositori dari GitHub...");
            let res = await fetch(`https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner`, {
                headers: ghHeaders
            });
            let repos = await res.json();

            if (!Array.isArray(repos) || !repos.length) {
                let fallbackRes = await fetch(`https://api.github.com/users/${ghUser}/repos?per_page=100&sort=updated`, {
                    headers: ghHeaders
                });
                repos = await fallbackRes.json();
            }

            if (!Array.isArray(repos) || !repos.length) return editMsg(load, "❌ Tidak ada repositori ditemukan.");

            let txt = `📂 DAFTAR REPOSITORI GITHUB\n👤 User: ${ghUser}\n📊 Total: ${repos.length} repo\n\n`;
            repos.forEach((r, i) => {
                const lock = r.private ? '🔒' : '🌐';
                txt += `${i + 1}. ${lock} ${r.name}\n🔗 ${r.html_url}\n\n`;
            });
            await editMsg(load, txt.trim());
        }

        if (cmd === 'delrepo' || cmd === 'deleterepository') {
            if (!text) {
                let res = await fetch(`https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner`, {
                    headers: ghHeaders
                });
                let repos = await res.json();
                if (!Array.isArray(repos) || !repos.length) return m.reply("❌ Tidak ada repositori yang bisa dihapus.");

                let rows = repos.slice(0, 50).map(r => ({
                    header: (r.visibility || (r.private ? 'PRIVATE' : 'PUBLIC')).toUpperCase(),
                    title: `🗑️ ${r.name}`,
                    description: `Hapus permanen repo ${r.name}`,
                    id: `${usedPrefix}delrepo ${r.name}`
                }));

                return await conn.sendMessage(m.chat, {
                    text: `⚠️ DELETE REPOSITORY\nPilih repositori yang ingin dihapus permanen!`,
                    footer: global.footer || 'Dafa',
                    buttons: [{
                        buttonId: "del_repo_btn",
                        buttonText: {
                            displayText: "🗑️ PILIH REPO"
                        },
                        type: 4,
                        nativeFlowInfo: {
                            name: "single_select",
                            paramsJson: JSON.stringify({
                                title: "Daftar Repositori",
                                sections: [{
                                    title: "Pilih Repo",
                                    rows
                                }]
                            })
                        }
                    }],
                    headerType: 1,
                    viewOnce: true
                }, {
                    quoted: m
                });
            }

            const targetRepo = text.trim();
            let load = await waitMsg(`Menghapus repositori ${targetRepo}...`);
            let res = await fetch(`https://api.github.com/repos/${ghUser}/${targetRepo}`, {
                method: 'DELETE',
                headers: ghHeaders
            });

            if (res.ok || res.status === 204) {
                await editMsg(load, `✅ Repositori ${targetRepo} berhasil dihapus permanen!`);
            } else {
                let err = await res.json().catch(() => ({}));
                await editMsg(load, `❌ Gagal menghapus repo: ${err.message || res.statusText}`);
            }
        }

        if (cmd === 'uploadfile' || cmd === 'editfile') {
            let q = m.quoted ? m.quoted : m;
            if (!text.includes('|')) {
                return m.reply(`📌 Format salah bray! Gunakan pembatas |\nContoh: ${usedPrefix + command} nama_repo | folder/nama_file.json\n\n_(Note: Bisa reply file dokumen ATAU reply pesan teks kodingannya)_`);
            }

            let [repo, filePath] = text.split('|').map(v => v.trim());
            if (!repo || !filePath) return m.reply("❌ Nama repo dan nama file tidak boleh kosong!");

            let b64 = '';
            if (q.mimetype || q.msg?.mimetype) {
                let buffer = await q.download();
                b64 = buffer.toString('base64');
            } else if (q.text) {
                b64 = Buffer.from(q.text).toString('base64');
            } else {
                return m.reply(`❌ Reply file dokumen/kode ATAU reply pesan teks biasa yang mau diupload!`);
            }

            let load = await waitMsg(`Memproses & mengupload ${filePath} ke GitHub repo ${repo}...`);
            let success = await uploadGH(repo, filePath, b64);

            if (success) {
                await editMsg(load, `✅ File ${filePath} berhasil diproses di repo ${repo}!`);
            } else {
                await editMsg(load, `❌ Gagal memproses file ke GitHub. Pastikan nama repo benar.`);
            }
        }

        if (cmd === 'delfile') {
            if (!text.includes('|')) {
                return m.reply(`📌 Format salah bray! Gunakan pembatas |\nContoh: ${usedPrefix + command} nama_repo | folder/file_yang_dihapus.js`);
            }

            let [repo, filePath] = text.split('|').map(v => v.trim());
            let cleanPath = filePath.replace(/^\/+/, '');
            let load = await waitMsg(`Mencari file ${cleanPath} di repo ${repo}...`);

            let url = `https://api.github.com/repos/${ghUser}/${repo}/contents/${cleanPath}`;
            let getRes = await fetch(url, {
                headers: ghHeaders
            });
            if (!getRes.ok) return editMsg(load, `❌ File ${cleanPath} tidak ditemukan di repo ${repo}.`);

            let getJson = await getRes.json();
            if (Array.isArray(getJson)) {
                return editMsg(load, `❌ Target adalah Folder bray, bukan File! Gunakan ${usedPrefix}clearfile untuk membersihkan.`);
            }

            await editMsg(load, `Sedang menghapus file ${cleanPath} dari GitHub...`);
            let deleteRes = await fetch(url, {
                method: 'DELETE',
                headers: ghHeaders,
                body: JSON.stringify({
                    message: `Hapus file ${cleanPath} via Bot`,
                    sha: getJson.sha
                })
            });

            if (deleteRes.ok) {
                await editMsg(load, `✅ File ${cleanPath} berhasil dihapus dari repo ${repo}!`);
            } else {
                await editMsg(load, `❌ Gagal menghapus file dari GitHub.`);
            }
        }

        if (cmd === 'clearfile') {
            if (!text) return m.reply(`📌 Masukkan nama repo yang mau dikosongkan file-filenya!\nContoh: ${usedPrefix + command} portfolio`);

            let repo = text.trim();
            let load = await waitMsg(`Membaca isi struktur root repo ${repo}...`);

            let url = `https://api.github.com/repos/${ghUser}/${repo}/contents/`;
            let res = await fetch(url, {
                headers: ghHeaders
            });
            if (!res.ok) return editMsg(load, `❌ Repo ${repo} tidak ditemukan atau gagal diakses.`);

            let items = await res.json();
            if (!Array.isArray(items) || items.length === 0) {
                return editMsg(load, `📭 Repo ${repo} emang udah kosong bray dari awal.`);
            }

            await editMsg(load, `Menghapus seluruh file dan folder secara massal dari repo ${repo}...`);

            let deletedCount = 0;
            const deleteRecursively = async (contentsUrl) => {
                let fetchItems = await fetch(contentsUrl, {
                    headers: ghHeaders
                }).then(r => r.json()).catch(() => []);

                if (!Array.isArray(fetchItems)) return;
                for (let item of fetchItems) {
                    if (item.type === 'dir') {
                        await deleteRecursively(item.url);
                    } else {
                        await fetch(item.url, {
                            method: 'DELETE',
                            headers: ghHeaders,
                            body: JSON.stringify({
                                message: `Clear file ${item.path} via Bot`,
                                sha: item.sha
                            })
                        });
                        deletedCount++;
                    }
                }
            };

            await deleteRecursively(url);
            await editMsg(load, `✅ Repo ${repo} bersih total! Berhasil menghapus ${deletedCount} file & folder.`);
        }

        if (cmd === 'lihatrepo') {
            if (!text) {
                let res = await fetch(`https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner`, {
                    headers: ghHeaders
                });
                let repos = await res.json();
                if (!Array.isArray(repos) || !repos.length) {
                    let fallbackRes = await fetch(`https://api.github.com/users/${ghUser}/repos?per_page=100&sort=updated`, {
                        headers: ghHeaders
                    });
                    repos = await fallbackRes.json();
                }

                if (!Array.isArray(repos) || !repos.length) return m.reply("❌ Tidak ada repositori ditemukan.");

                let rows = repos.slice(0, 50).map(r => ({
                    header: (r.visibility || (r.private ? 'PRIVATE' : 'PUBLIC')).toUpperCase(),
                    title: `📂 ${r.name}`,
                    description: `Lihat isi direktori repo ${r.name}`,
                    id: `${usedPrefix}lihatrepo ${r.name}`
                }));

                return await conn.sendMessage(m.chat, {
                    text: `🔍 EXPLORE REPOSITORY\nPilih repositori GitHub yang pengen lu lihat isi dalemnya bray.`,
                    footer: global.footer || 'Dafa',
                    buttons: [{
                        buttonId: "view_repo_select",
                        buttonText: {
                            displayText: "📂 PILIH REPO"
                        },
                        type: 4,
                        nativeFlowInfo: {
                            name: "single_select",
                            paramsJson: JSON.stringify({
                                title: "Daftar Repositori",
                                sections: [{
                                    title: "Pilih Repo",
                                    rows
                                }]
                            })
                        }
                    }],
                    headerType: 1,
                    viewOnce: true
                }, {
                    quoted: m
                });
            }

            let inputData = text.split('|').map(v => v.trim());
            let repo = inputData[0];
            let filePath = inputData.slice(1).join('/');
            let cleanPath = (filePath || '').replace(/^\/+/, '');

            let load = await waitMsg(`Membuka direktori ${cleanPath || repo}...`);
            let res = await fetch(`https://api.github.com/repos/${ghUser}/${repo}/contents/${cleanPath}`, {
                headers: ghHeaders
            });
            let json = await res.json();

            if (!res.ok) return editMsg(load, `❌ Gagal mengambil isi: ${json.message || 'File/folder tidak ditemukan'}`);

            if (Array.isArray(json)) {
                if (!json.length) return editMsg(load, `📁 Direktori ${cleanPath || repo} ini kosong bray.`);
                json.sort((a, b) => (b.type === 'dir') - (a.type === 'dir'));

                let rows = json.slice(0, 50).map(item => {
                    let isDir = item.type === 'dir';
                    let nextPath = cleanPath ? `${repo} | ${cleanPath}/${item.name}` : `${repo} | ${item.name}`;
                    return {
                        header: isDir ? "FOLDER" : "FILE",
                        title: `${isDir ? '📁' : '📄'} ${item.name}`,
                        description: isDir ? `Buka folder ini` : `Lihat isi file`,
                        id: `${usedPrefix}lihatrepo ${nextPath}`
                    };
                });

                await conn.sendMessage(m.chat, {
                    delete: load.key
                });
                return await conn.sendMessage(m.chat, {
                    text: `📁 DIREKTORI: ${cleanPath ? `${repo}/${cleanPath}` : repo}`,
                    footer: global.footer || 'Dafa',
                    buttons: [{
                        buttonId: "explore_repo_btn",
                        buttonText: {
                            displayText: "🔍 JELAJAHI"
                        },
                        type: 4,
                        nativeFlowInfo: {
                            name: "single_select",
                            paramsJson: JSON.stringify({
                                title: "Isi Folder/Repo",
                                sections: [{
                                    title: "Folder & File",
                                    rows
                                }]
                            })
                        }
                    }],
                    headerType: 1,
                    viewOnce: true
                }, {
                    quoted: m
                });

            } else if (json.type === 'file') {
                let content = Buffer.from(json.content, 'base64').toString('utf-8');
                let caption = `📄 FILE: ${repo}/${cleanPath}\n\n`;

                if (content.length > 4000) {
                    await conn.sendMessage(m.chat, {
                        delete: load.key
                    });
                    await conn.sendMessage(m.chat, {
                        document: Buffer.from(content),
                        mimetype: 'text/plain',
                        fileName: json.name,
                        caption: caption
                    }, {
                        quoted: m
                    });
                } else {
                    await editMsg(load, caption + `\`\`\`\n${content}\n\`\`\``);
                }
            }
        }

        if (cmd === 'uploadfile2' || cmd === 'uploadzip') {
            let q = m.quoted ? m.quoted : m;
            let mime = q.mimetype || q.msg?.mimetype || '';
            if (!mime.includes('zip')) return m.reply(`📌 Reply file .zip yang mau diupload!`);
            if (!args[0]) return m.reply(`📌 Masukkan nama repo target!\nContoh: ${usedPrefix + command} nama_repo`);

            if (!AdmZip) {
                return m.reply("❌ Module adm-zip belum tersedia di sistem!");
            }

            let repo = args[0].trim();
            let load = await waitMsg("Mendownload ZIP & mengekstrak file ke halaman utama GitHub...");

            let buffer = await q.download();
            let zip = new AdmZip(buffer);
            let entries = zip.getEntries();

            if (!entries || entries.length === 0) return editMsg(load, "❌ File ZIP kosong!");

            let firstEntryParts = entries[0].entryName.split('/');
            let possibleRoot = firstEntryParts[0] + '/';
            let hasCommonRoot = entries.every(e => e.entryName.startsWith(possibleRoot));

            let count = 0;
            for (let entry of entries) {
                if (entry.isDirectory) continue;
                let filePath = entry.entryName;
                if (hasCommonRoot) filePath = filePath.substring(possibleRoot.length);
                if (!filePath) continue;

                let b64 = entry.getData().toString('base64');
                await uploadGH(repo, filePath, b64);
                count++;
            }
            await editMsg(load, `✅ Sukses!\n${count} file berhasil di-unzip dan ditaruh langsung ke root repo ${repo}!`);
        }

        if (cmd === 'listdeploy') {
            if (!vcToken) return m.reply("❌ Token Vercel belum diatur di settings.js!");

            let load = await waitMsg("Mengambil data deployment Vercel terkini...");
            let res = await fetch(`https://api.vercel.com/v9/projects`, {
                headers: vcHeaders
            });
            let json = await res.json();

            if (!json.projects || !json.projects.length) return editMsg(load, "❌ Tidak ada deployment/project Vercel.");

            let txt = `🚀 DAFTAR VERCEL DEPLOYMENT\n\n`;
            json.projects.forEach((p, i) => {
                let latest = p.latestDeployments ? p.latestDeployments[0] : null;
                let statusRaw = latest ? latest.readyState : 'UNKNOWN';
                let status = statusRaw === 'READY' ? '✅ Berhasil' : statusRaw === 'BUILDING' ? '⏳ Sedang Build...' : statusRaw === 'ERROR' ? '❌ Gagal' : '⚪ ' + statusRaw;

                let realUrl = latest?.url ? `https://${latest.url}` : 'Sedang menyiapkan URL...';
                let aliasUrl = p.targets?.production?.alias ? `https://${p.targets.production.alias[0]}` : '';

                txt += `${i + 1}. ${p.name}\n📊 Status: ${status}\n🔗 Domain Project: ${realUrl}\n`;
                if (aliasUrl && aliasUrl !== realUrl) txt += `🔗 Domain Alias: ${aliasUrl}\n`;
                txt += `📅 Updated: ${new Date(p.updatedAt).toLocaleString('id-ID')}\n\n`;
            });
            await editMsg(load, txt.trim());
        }

        if (cmd === 'deldeploy') {
            if (!vcToken) return m.reply("❌ Token Vercel belum diatur di settings.js!");

            if (!text) {
                let res = await fetch(`https://api.vercel.com/v9/projects`, {
                    headers: vcHeaders
                });
                let json = await res.json();
                if (!json.projects || !json.projects.length) return m.reply("❌ Tidak ada project Vercel.");

                let rows = json.projects.slice(0, 50).map(p => ({
                    header: "VERCEL PROJECT",
                    title: `🗑️ ${p.name}`,
                    description: `Hapus project ${p.name} permanen`,
                    id: `${usedPrefix}deldeploy ${p.id}`
                }));

                return await conn.sendMessage(m.chat, {
                    text: `⚠️ DELETE DEPLOYMENT\nPilih project Vercel yang ingin dihapus permanen!`,
                    footer: global.footer || 'Dafa',
                    buttons: [{
                        buttonId: "del_deploy_btn",
                        buttonText: {
                            displayText: "🗑️ PILIH DEPLOYMENT"
                        },
                        type: 4,
                        nativeFlowInfo: {
                            name: "single_select",
                            paramsJson: JSON.stringify({
                                title: "Daftar Project",
                                sections: [{
                                    title: "Pilih Yang Mau Dihapus",
                                    rows
                                }]
                            })
                        }
                    }],
                    headerType: 1,
                    viewOnce: true
                }, {
                    quoted: m
                });
            }

            let targetId = text.trim();
            let load = await waitMsg(`Menghapus project Vercel ${targetId}...`);
            let res = await fetch(`https://api.vercel.com/v9/projects/${targetId}`, {
                method: 'DELETE',
                headers: vcHeaders
            });

            if (res.ok || res.status === 204) {
                await editMsg(load, `✅ Project Vercel ${targetId} berhasil dihapus permanen!`);
            } else {
                let err = await res.json().catch(() => ({}));
                await editMsg(load, `❌ Gagal menghapus project: ${err.error?.message || res.statusText}`);
            }
        }

        if (cmd === 'deploy') {
            if (!vcToken) return m.reply("❌ Token Vercel belum diatur di settings.js!");

            if (!text) {
                let res = await fetch(`https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner`, {
                    headers: ghHeaders
                });
                let repos = await res.json();
                if (!Array.isArray(repos) || !repos.length) {
                    let fallbackRes = await fetch(`https://api.github.com/users/${ghUser}/repos?per_page=100&sort=updated`, {
                        headers: ghHeaders
                    });
                    repos = await fallbackRes.json();
                }

                if (!Array.isArray(repos) || !repos.length) return m.reply("❌ Gagal mendeploy, tidak ada repo di GitHub.");

                let rows = repos.slice(0, 50).map(r => ({
                    header: "DEFAULT DEPLOY",
                    title: `🚀 ${r.name}`,
                    description: `Deploy langsung: ${r.name.toLowerCase()}`,
                    id: `${usedPrefix}deploy https://github.com/${ghUser}/${r.name} | ${r.name.toLowerCase()}`
                }));

                return await conn.sendMessage(m.chat, {
                    text: `🚀 VERCEL DEPLOYMENT\nPilih repo untuk dideploy instan pakai nama default, atau ketik manual dengan format:\n_${usedPrefix}deploy [url_repo] | [nama_custom]_\nAtau cukup ketik:\n_${usedPrefix}deploy [nama_repo]_`,
                    footer: global.footer || 'Dafa',
                    buttons: [{
                        buttonId: "deploy_select_btn",
                        buttonText: {
                            displayText: "🚀 DEPLOY INSTAN"
                        },
                        type: 4,
                        nativeFlowInfo: {
                            name: "single_select",
                            paramsJson: JSON.stringify({
                                title: "Daftar Repo",
                                sections: [{
                                    title: "Pilih Repo Default",
                                    rows
                                }]
                            })
                        }
                    }],
                    headerType: 1,
                    viewOnce: true
                }, {
                    quoted: m
                });
            }

            let repoUrl = '';
            let projectName = '';

            if (text.includes('|')) {
                const parts = text.split('|').map(v => v.trim());
                repoUrl = parts[0];
                projectName = parts[1];
            } else {
                let input = text.trim();
                if (input.startsWith('http://') || input.startsWith('https://')) {
                    repoUrl = input;
                    const pathParts = input.replace(/https?:\/\/github\.com\//, '').replace(/\.git$/, '').split('/');
                    projectName = pathParts[pathParts.length - 1];
                } else {
                    repoUrl = `https://github.com/${ghUser}/${input}`;
                    projectName = input;
                }
            }

            let repoPath = repoUrl.replace(/https?:\/\/github\.com\//, '').replace(/\.git$/, '');
            let safeProjectName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '') || 'project';

            let load = await waitMsg(`Menyiapkan server Vercel & memeriksa repo GitHub ${repoPath}...`);

            let ghRes = await fetch(`https://api.github.com/repos/${repoPath}`, {
                headers: ghHeaders
            });
            let ghJson = await ghRes.json();
            if (!ghRes.ok) return editMsg(load, `❌ Gagal mengambil info dari GitHub: ${ghJson.message}`);

            let repoId = ghJson.id;
            let defaultBranch = ghJson.default_branch || "main";

            let res = await fetch(`https://api.vercel.com/v9/projects/${safeProjectName}`, {
                headers: vcHeaders
            });
            let projectData = await res.json();
            let finalProjectName = safeProjectName;

            if (!res.ok) {
                let createRes = await fetch('https://api.vercel.com/v9/projects', {
                    method: 'POST',
                    headers: vcHeaders,
                    body: JSON.stringify({
                        name: safeProjectName,
                        gitRepository: {
                            type: "github",
                            repo: repoPath
                        }
                    })
                });
                projectData = await createRes.json();

                if (!createRes.ok) {
                    let randomSuffix = Math.random().toString(36).substring(2, 6);
                    finalProjectName = `${safeProjectName}-${randomSuffix}`;
                    createRes = await fetch('https://api.vercel.com/v9/projects', {
                        method: 'POST',
                        headers: vcHeaders,
                        body: JSON.stringify({
                            name: finalProjectName,
                            gitRepository: {
                                type: "github",
                                repo: repoPath
                            }
                        })
                    });
                    projectData = await createRes.json();

                    if (!createRes.ok) {
                        return editMsg(load, `❌ Gagal membuat project Vercel: ${projectData.error?.message || createRes.statusText}`);
                    }
                }
            }

            await editMsg(load, `Memicu pipeline deployment ke server Vercel...`);
            let deployRes = await fetch('https://api.vercel.com/v13/deployments', {
                method: 'POST',
                headers: vcHeaders,
                body: JSON.stringify({
                    name: finalProjectName,
                    gitSource: {
                        type: "github",
                        repoId: repoId,
                        ref: defaultBranch
                    }
                })
            });
            let deployJson = await deployRes.json();

            if (!deployRes.ok) {
                return editMsg(load, `❌ Project siap, tapi gagal memicu tarikan kode GitHub: ${deployJson.error?.message || deployRes.statusText}`);
            }

            let deployTxt = `✅ DEPLOYMENT BERHASIL DIPICU!\n\n`;
            deployTxt += `📦 Project: ${finalProjectName}\n`;
            deployTxt += `🐙 GitHub: ${repoPath} (${defaultBranch})\n`;
            deployTxt += `⏳ Status: Sedang di-build oleh Vercel...\n\n`;
            deployTxt += `🌐 Domain Project: https://${deployJson.url}\n`;
            deployTxt += `_Ketik ${usedPrefix}logdeploy ${deployJson.url} untuk mantau build log!_`;

            await editMsg(load, deployTxt);
        }

        if (cmd === 'logdeploy' || cmd === 'deploylog') {
            if (!vcToken) return m.reply("❌ Token Vercel belum diatur di settings.js!");
            if (!text) return m.reply(`📌 Masukkan URL Domain Project atau ID Deployment!\nContoh: ${usedPrefix + command} web-portfolio-x8f2.vercel.app`);

            let targetUrl = text.replace(/^https?:\/\//, '').trim();
            let load = await waitMsg("Mengambil Build Logs dari server Vercel...");

            let res = await fetch(`https://api.vercel.com/v3/deployments/${encodeURIComponent(targetUrl)}/events?limit=100`, {
                headers: vcHeaders
            });
            if (!res.ok) {
                let errJson = await res.json().catch(() => ({}));
                return editMsg(load, `❌ Gagal mengambil log: ${errJson.error?.message || res.statusText}`);
            }

            let json = await res.json();
            if (!Array.isArray(json) || json.length === 0) {
                return editMsg(load, `📭 Belum ada log event untuk deployment ini.`);
            }

            let logLines = [];
            json.forEach(event => {
                let msg = event.text || event.payload?.text || (typeof event.payload === 'string' ? event.payload : '');
                if (msg) logLines.push(msg.trim());
            });

            let logContent = logLines.join("\n");
            if (!logContent.trim()) {
                return editMsg(load, `📭 Log kosong atau hanya berisi metadata sistem.`);
            }

            let caption = `📄 BUILD LOGS:\n🔗 ${targetUrl}\n\n`;
            if (logContent.length > 3000) {
                await conn.sendMessage(m.chat, {
                    delete: load.key
                });
                await conn.sendMessage(m.chat, {
                    document: Buffer.from(logContent),
                    mimetype: 'text/plain',
                    fileName: `BuildLog_${targetUrl.replace(/[^a-zA-Z0-9]/g, '_')}.txt`,
                    caption: caption + `_Log panjang, silakan baca file di atas!_`
                }, {
                    quoted: m
                });
            } else {
                await editMsg(load, caption + `\`\`\`\n${logContent.trim()}\n\`\`\``);
            }
        }

    } catch (e) {
        console.error(e);
        m.reply(`❌ Error: ${e.message}`);
    }
};

handler.help = [
    'addrepo',
    'listrepo',
    'delrepo',
    'uploadfile',
    'uploadzip',
    'editfile',
    'lihatrepo',
    'delfile',
    'clearfile',
    'listdeploy',
    'deldeploy',
    'deploy',
    'logdeploy'
];
handler.tags = ['deploy'];
handler.command = /^(addrepo|listrepo|listrepositori|delrepo|deleterepository|uploadfile|uploadfile2|uploadzip|editfile|lihatrepo|delfile|clearfile|listdeploy|deldeploy|deploy|logdeploy|deploylog)$/i;
handler.owner = true;

export default handler;
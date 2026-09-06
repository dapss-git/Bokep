let handler = async (m, {
    conn,
    cmd
}) => {
    let stats = Object.entries(global.db.data.stats).map(([key, val]) => {
        let pluginPath = Object.keys(cmd.plugins).find(p => p.split(/[/\\]/).pop() === key)
        let plugin = pluginPath ? cmd.plugins[pluginPath] : null
        let help = plugin?.help
        let name = Array.isArray(help) ? help.join(' & ') : help || key
        if (/exec/.test(name)) return null
        return {
            name,
            ...val
        }
    }).filter(Boolean)
    stats = stats.sort((a, b) => b.last - a.last)
    let txt = stats.slice(0, 10).map(({
        name,
        total,
        last
    }, idx) => {
        if (name.includes('-') && name.endsWith('.js')) name = name.split('-')[1].replace('.js', '')
        return `(${idx + 1})\nCommand : *${name}*\nHit : *${total}x*\nLast Used : *${getTime(last)}*`
    }).join`\n\n`
    m.reply(`Dashboard *${conn.user.name}*\n\n${txt}`)
}
handler.help = ['dashboard']
handler.tags = ['info']
handler.command = /^dashboard$/i

handler.register = true

export default handler

export function parseMs(ms) {
    if (typeof ms !== 'number') throw 'Parameter must be filled with number'
    return {
        days: Math.trunc(ms / 86400000),
        hours: Math.trunc(ms / 3600000) % 24,
        minutes: Math.trunc(ms / 60000) % 60,
        seconds: Math.trunc(ms / 1000) % 60,
        milliseconds: Math.trunc(ms) % 1000,
        microseconds: Math.trunc(ms * 1000) % 1000,
        nanoseconds: Math.trunc(ms * 1e6) % 1000
    }
}

export function getTime(ms) {
    let now = parseMs(+new Date() - ms)
    if (now.days) return `${now.days} days ago`
    else if (now.hours) return `${now.hours} hours ago`
    else if (now.minutes) return `${now.minutes} minutes ago`
    else return `a few seconds ago`
}
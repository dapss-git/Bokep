import { promises } from 'fs'
import { join } from 'path'
import { spawn } from 'child_process'

async function ensureTmp() {
  const tmpDir = join(process.cwd(), 'tmp')
  try {
    await promises.mkdir(tmpDir, { recursive: true })
  } catch {}
  return tmpDir
}

function ffmpeg(buffer, args = [], ext = '', ext2 = '') {
  return new Promise(async (resolve, reject) => {
    try {
      const tmpDir = await ensureTmp()
      const file = `${Date.now()}`
      const input = join(tmpDir, `${file}.${ext}`)
      const output = join(tmpDir, `${file}.${ext2}`)

      await promises.writeFile(input, buffer)

      const proc = spawn('ffmpeg', [
        '-y',
        '-i', input,
        ...args,
        output
      ])

      let stderr = ''
      proc.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      proc.on('error', (err) => {
        reject(err)
      })

      proc.on('close', async (code) => {
        try {
          try { await promises.unlink(input) } catch {}

          if (code !== 0) {
            return reject(new Error(`FFmpeg gagal dengan code ${code}`))
          }

          const data = await promises.readFile(output)

          resolve({
            data,
            filename: output,
            delete() {
              return promises.unlink(output).catch(() => {})
            }
          })
        } catch (e) {
          reject(e)
        }
      })

    } catch (e) {
      reject(e)
    }
  })
}

async function toPTT(buffer, ext) {
  try {
    const firstOpus = await ffmpeg(buffer, [
      '-vn',
      '-c:a', 'libopus',
      '-b:a', '128k',
      '-vbr', 'on'
    ], ext, 'opus')

    const midMp3 = await ffmpeg(firstOpus.data, [
      '-vn',
      '-ac', '2',
      '-b:a', '128k',
      '-ar', '44100'
    ], 'opus', 'mp3')
    await firstOpus.delete()

    const finalOpus = await ffmpeg(midMp3.data, [
      '-vn',
      '-c:a', 'libopus',
      '-b:a', '128k',
      '-vbr', 'on',
      '-ar', '48000',
      '-ac', '1',
      '-flags', '+global_header',
      '-compression_level', '10'
    ], 'mp3', 'ogg')
    await midMp3.delete()

    return finalOpus
  } catch (e) {
    throw e
  }
}

async function toAudio(buffer, ext) {
  try {
    return await ffmpeg(buffer, [
      '-vn',
      '-c:a', 'libopus',
      '-b:a', '128k',
      '-vbr', 'on',
      '-ar', '48000',
      '-ac', '1',
      '-compression_level', '10'
    ], ext, 'opus')
  } catch (e) {
    throw e
  }
}

function toVideo(buffer, ext) {
  return ffmpeg(buffer, [
    '-c:v', 'libx264',
    '-c:a', 'aac',
    '-ab', '128k',
    '-ar', '44100',
    '-crf', '32',
    '-preset', 'slow'
  ], ext, 'mp4')
}

export {
  toAudio,
  toPTT,
  toVideo,
  ffmpeg
}
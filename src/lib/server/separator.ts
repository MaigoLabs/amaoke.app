import { error } from 'console'
import { promises as fs } from 'fs'
import path from 'path'

const API_URL = process.env.AUDIO_SEPARATOR_API

/**
 * Separates a song into vocals and instrumental tracks using the Python API server.
 * @param inputPath Absolute path to the input audio file.
 * @param outputDir Directory where the output files (vocals.mp3, instrumental.mp3) will be saved.
 */
export async function separateSong(inputPath: string, outputDir: string) {
    const vocalsPath = path.join(outputDir, 'vocals.opus')
    const instrumentalPath = path.join(outputDir, 'instrumental.opus')
    if (await fs.exists(vocalsPath) && await fs.exists(instrumentalPath)) {
        console.log(`Separation already done for ${inputPath}`)
        return
    }

    console.log(`Starting separation for ${inputPath}`)

    // Read file and create FormData
    const fileBuffer = await fs.readFile(inputPath)
    const formData = new FormData()
    formData.append('file', new Blob([fileBuffer]), 'input.mp3')

    const res = await fetch(`${API_URL}/separate`, { method: 'POST', body: formData })
    if (!res.ok) throw error(500, '无法连接到分离服务')
    const { task_id } = await res.json()

    // Poll for completion
    while (true) {
        await new Promise(r => setTimeout(r, 1000))
        const statusRes = await fetch(`${API_URL}/status/${task_id}`)
        const status = await statusRes.json()

        if (status.status === 'completed') {
            // Download results
            const downloadStem = async (stem: string, dest: string) => {
                const fileRes = await fetch(`${API_URL}/result/${task_id}/${stem}`)
                if (!fileRes.ok) throw error(500, `无法下载 ${stem}`)
                const buffer = await fileRes.arrayBuffer()
                await fs.writeFile(dest, Buffer.from(buffer))
            }

            await downloadStem('vocals', vocalsPath)
            await downloadStem('instrumental', instrumentalPath)
            console.log(`Separation completed for ${inputPath}`)
            
            // Clean up task on server
            try {
                await fetch(`${API_URL}/task/${task_id}`, { method: 'DELETE' })
            } catch (e) {
                console.warn(`无法清理任务 ${task_id}:`, e)
            }
            break
        }
        if (status.status === 'error') {
            console.error(`Separation failed for ${inputPath}: ${status.error}`)
            throw error(500, status.error || '分离失败')
        }
        if (status.status === 'not_found') {
            console.error(`Separation task lost for ${inputPath}`)
            throw error(500, '任务丢失')
        }
    }
}

export async function checkAudioSeparator() {
    if (!API_URL) return console.warn('未设置音频分离服务地址，跳过连接性检查')
    try {
        const res = await fetch(API_URL)
        if (res.ok) console.log(`音频分离服务连接成功 ${API_URL}`)
        else console.warn(`音频分离服务返回状态 ${res.status} at ${API_URL}`)
    } catch (e) {
        console.error(`无法连接到音频分离服务 ${API_URL}:`, e)
    }
}

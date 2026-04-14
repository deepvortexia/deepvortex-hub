import type { VercelRequest, VercelResponse } from '@vercel/node'

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || ''
const HOST = 'deepvortexai.com'

const ALL_URLS = [
  // Hub root
  `https://${HOST}/`,

  // Primary hub pages
  `https://${HOST}/ai`,
  `https://${HOST}/portal`,
  `https://${HOST}/game`,
  `https://${HOST}/about`,
  `https://${HOST}/vs`,

  // Tool landing pages
  `https://${HOST}/ai-image-generator`,
  `https://${HOST}/ai-voice-generator`,
  `https://${HOST}/ai-emoticon-generator`,
  `https://${HOST}/ai-background-remover`,
  `https://${HOST}/ai-3d-model-generator`,

  // Solutions pages
  `https://${HOST}/solutions/digital-artists`,
  `https://${HOST}/solutions/e-commerce`,
  `https://${HOST}/solutions/gamers`,
  `https://${HOST}/solutions/real-estate`,
  `https://${HOST}/solutions/youtubers`,

  // Blog index
  `https://${HOST}/blog/`,

  // Blog articles (directory-style)
  `https://${HOST}/blog/how-to-remove-image-background-with-ai/`,
  `https://${HOST}/blog/best-ai-image-upscaler-2026/`,
  `https://${HOST}/blog/turn-photo-into-3d-model-online/`,
  `https://${HOST}/blog/ai-image-to-video-generator-guide/`,
  `https://${HOST}/blog/ai-voice-generator-text-to-speech/`,
  `https://${HOST}/blog/best-ai-image-generator-2026/`,
  `https://${HOST}/blog/custom-ai-emoticon-generator/`,
  `https://${HOST}/blog/deep-vortex-ai-all-tools-guide/`,
  `https://${HOST}/blog/ai-image-editor-vs-photoshop-2026/`,
  `https://${HOST}/blog/best-ai-creative-tools-2026/`,
  `https://${HOST}/blog/best-ai-image-editor-2026/`,
  `https://${HOST}/blog/can-ai-predict-the-next-war/`,
  `https://${HOST}/blog/can-deepfakes-start-a-war/`,
  `https://${HOST}/blog/how-to-edit-photos-with-ai-free/`,
  `https://${HOST}/blog/usa-vs-china-ai-race/`,
  `https://${HOST}/blog/will-ai-replace-soldiers/`,

  // Blog articles (flat)
  `https://${HOST}/blog/best-free-ai-avatar-generator-2026`,
  `https://${HOST}/blog/how-to-remove-image-background-ai-free`,
  `https://${HOST}/blog/best-free-ai-voice-cloner-2026`,
  `https://${HOST}/blog/how-to-upscale-image-ai-free`,
  `https://${HOST}/blog/best-all-in-one-ai-platform-2026`,
  `https://${HOST}/blog/best-ai-chat-multiple-models-2026`,

  // Tool subdomains
  'https://emoticons.deepvortexai.com/',
  'https://video.deepvortexai.com/',
  'https://avatar.deepvortexai.com/',
  'https://bgremover.deepvortexai.com/',
  'https://upscaler.deepvortexai.com/',
  'https://3d.deepvortexai.com/',
  'https://voice.deepvortexai.com/',
  'https://logo.deepvortexai.com/',
  'https://chat.deepvortexai.com/',
]

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const secret = req.headers['x-indexnow-secret']
  if (!secret || secret !== process.env.INDEXNOW_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { urls }: { urls?: string[] } = req.body ?? {}
  const urlsToSubmit = (urls && urls.length > 0) ? urls : ALL_URLS

  const payload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
    urlList: urlsToSubmit,
  }

  try {
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    })

    if (response.ok || response.status === 202) {
      return res.status(200).json({ submitted: urlsToSubmit.length, status: response.status })
    }

    const text = await response.text()
    return res.status(500).json({ error: `IndexNow rejected: ${response.status}`, detail: text })
  } catch (err: any) {
    console.error('IndexNow error:', err)
    return res.status(500).json({ error: err.message })
  }
}

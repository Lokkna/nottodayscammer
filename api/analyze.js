export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not set');
    return res.status(500).json({ error: 'Something went wrong on our end. Please try again in a moment.' });
  }

  const { content, image, mediaType, tabLabel } = req.body;

  if (!content && !image) {
    return res.status(400).json({ error: 'No content provided' });
  }

  if (image && image.length > 8000000) {
    return res.status(400).json({ error: 'That image is too large. Please try a smaller screenshot.' });
  }

  const allowedMediaTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (image && !allowedMediaTypes.includes(mediaType)) {
    return res.status(400).json({ error: 'Unsupported image format. Please use JPEG, PNG, GIF, or WebP.' });
  }

  const basePrompt = `You are NotTodayScammer!, an expert scam detection AI protecting people — especially elderly and vulnerable individuals — from fraud, scams, and manipulation.

Analyze this ${tabLabel || 'content'} and respond ONLY with a valid JSON object. No markdown, no backticks, no explanation before or after.

Format:
{"verdict":"SAFE or SUSPICIOUS or SCAM","confidence":0-100,"summary":"One plain sentence under 20 words.","flags":[{"type":"danger or warning or safe","text":"Specific finding, plain language, under 15 words."}],"advice":"2-3 sentences of direct plain-language advice. What should this person do right now?"}

Rules:
- 2-5 flags. Mix danger/warning/safe as appropriate.
- Write for someone who is not tech-savvy. No jargon.
- If SCAM or SUSPICIOUS: be firm and name the exact tactic being used.
- If a URL: flag the domain name specifically if suspicious.
- If SAFE: still note anything to watch for.
- IMPORTANT: When genuinely uncertain or borderline, lean toward SUSPICIOUS rather than SAFE. A false "SAFE" on a real scam is far more harmful than an unnecessary caution on a real safe message. Only return SAFE when you are confident there are no red flags at all.
- Return ONLY the JSON object.`;

  let messageContent;

  if (image) {
    messageContent = [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: image
        }
      },
      {
        type: 'text',
        text: `${basePrompt}\n\nThe image above is a screenshot the user is asking you to analyze. Read any visible text, sender names, phone numbers, URLs, or logos in the image and evaluate it for scam indicators just as you would with pasted text.`
      }
    ];
  } else {
    messageContent = `${basePrompt}\n\nContent to analyze:\n${content}`;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1000,
        temperature: 0,
        messages: [{ role: 'user', content: messageContent }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic API error:', response.status, err);
      return res.status(502).json({ error: 'Our AI service is temporarily unavailable. Please try again in a moment.' });
    }

    const data = await response.json();
    const raw = (data.content || []).find(b => b.type === 'text')?.text || '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error('Could not parse AI response as JSON:', raw);
      return res.status(502).json({ error: 'We had trouble analyzing that. Please try again.' });
    }

    const result = JSON.parse(match[0]);
    return res.status(200).json(result);
  } catch (err) {
    console.error('Unexpected error in /api/analyze:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again in a moment.' });
  }
}

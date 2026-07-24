export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const { content, tabLabel } = req.body;
  if (!content) return res.status(400).json({ error: 'No content provided' });

  const prompt = `You are NotTodayScammer!, an expert scam detection AI protecting people — especially elderly and vulnerable individuals — from fraud, scams, and manipulation.

Analyze this ${tabLabel || 'content'} and respond ONLY with a valid JSON object. No markdown, no backticks, no explanation before or after.

Format:
{"verdict":"SAFE or SUSPICIOUS or SCAM","confidence":0-100,"summary":"One plain sentence under 20 words.","flags":[{"type":"danger or warning or safe","text":"Specific finding, plain language, under 15 words."}],"advice":"2-3 sentences of direct plain-language advice. What should this person do right now?"}

Rules:
- 2-5 flags. Mix danger/warning/safe as appropriate.
- Write for someone who is not tech-savvy. No jargon.
- If SCAM or SUSPICIOUS: be firm and name the exact tactic being used.
- If a URL: flag the domain name specifically if suspicious.
- If SAFE: still note anything to watch for.
- Return ONLY the JSON object.

Content to analyze:
${content}`;

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
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    const raw = (data.content || []).find(b => b.type === 'text')?.text || '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: 'Invalid AI response' });

    const result = JSON.parse(match[0]);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

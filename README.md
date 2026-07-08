# NotTodayScammer!

AI-powered instant scam detection. Paste any suspicious message, link, or phone call — get a plain-language verdict in seconds. Free. No signup.

Built by Maurice Ndole / Ndole Media Group.

---


## Deploy to Vercel

### File structure
```
nottodayscammer/
├── api/
│   └── analyze.js       ← serverless API (keeps your API key secret)
├── public/
│   └── index.html       ← the entire frontend
├── package.json
├── vercel.json
└── README.md
```

### Steps
1. Push this folder to your GitHub repo (Mndole/nottodayscammer)
2. In Vercel: Add New Project → import Mndole/nottodayscammer
3. Deploy (first deploy will fail — that's fine)
4. Go to Settings → Environment Variables
5. Add: ANTHROPIC_API_KEY = your key from console.anthropic.com
6. Redeploy → live in 30 seconds
7. Add custom domain: nottodayscammer.com from Settings → Domains

---

## Roadmap
- [ ] Community scam feed
- [ ] FTC + FBI IC3 live alerts integration
- [ ] PhishTank URL database
- [ ] Mobile app (Capacitor)
- [ ] Email alert subscriptions
- [ ] Family protection plan
- [ ] White-label for banks and senior care orgs

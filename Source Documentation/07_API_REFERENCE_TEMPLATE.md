# CareerX — API Reference

## Endpoint

`POST /api/simulate`

## Request

```json
{
  "year": 1,
  "skills": ["Python", "C++", "HTML"],
  "interests": ["AI", "Web Development"]
}
```

## Success response

```json
{
  "paths": [
    {
      "title": "Example Career",
      "summary": "Example summary",
      "whyItFits": "Example reason referencing Python and AI",
      "fitScore": 82,
      "fitReason": "Example score explanation",
      "skillGaps": [],
      "milestones": [],
      "projects": [],
      "first30Days": []
    }
  ]
}
```

The concrete response must conform to `02_TECHNICAL_SPEC.md` and `lib/schema.ts`.

## Validation behavior

Invalid requests:
- return a clear client error
- do not call the AI provider

AI response failure:
- validate
- retry once
- fallback on repeated failure

## Security

Never expose:
`ANTHROPIC_API_KEY`

Never log:
- API keys
- sensitive credentials

## Mock mode

When `USE_MOCK=true`:
- do not call Anthropic
- return `/lib/mock/simulate.json`

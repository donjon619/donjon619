# Internal Sales Command Center

This is a browser-first internal sales workspace for follow-ups, quotations, customer memory, and AI document reading.

## What it does

- Tracks project name, customer, contact, next action, stage, priority, dates, value, and status
- Chooses one clear `Do this next` task for you
- Creates simple English email and call drafts you can copy
- Uploads files into the browser and keeps searchable summaries locally
- Extracts text from plain text files, PDF, DOCX, XLSX, and CSV inside the browser
- Uses OpenAI for live document analysis when you add your own API key

## Best use

1. Open `index.html` in Chrome or Edge.
2. Add every active enquiry or quotation as one task.
3. Fill `Project name`, `Next action`, and `Follow-up date` every time.
4. Upload the files you need for that customer or project.
5. Ask AI for summary, payment terms, delivery dates, missing approvals, and next actions.

## AI note

- The browser version can use your own OpenAI key for private use.
- For a public or team deployment, move the key to a backend proxy.
- PDF files can be sent to the Responses API as file inputs.
- Images can be sent to the Responses API as image inputs.

## Current limit

- PPTX and some uncommon file types are stored but not extracted in-browser yet.
- Very large files are trimmed so the browser stays fast.
- Production security is better with a backend instead of a browser-held key.

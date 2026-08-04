# Digital Enviro

A frontend learning hub for software development, AI &amp; machine learning, prompt engineering, web development, cyber security, cloud computing, and blockchain development — built as static HTML/CSS/JS with no build tooling required.

## Structure

```
digital-enviro/
├── index.html            Homepage
├── lessons.html           Lessons hub (all tracks)
├── videos.html            Video tutorials, filterable by topic
├── practice.html          Live code playground
├── robots.txt / sitemap.xml
├── css/styles.css         Full design system
├── js/
│   ├── main.js            Nav toggle, active link, footer year
│   ├── playground.js      Code playground (live JS/HTML/CSS, sample output for others)
│   └── ai-assistant.js    AI Tutor chat widget (present on every page)
├── lessons/
│   ├── javascript.html
│   ├── python.html
│   ├── html-css.html
│   ├── java.html
│   ├── cpp.html
│   └── sql.html
├── assets/logo.png        Site logo (used as favicon + nav brand mark)
└── server/                Optional backend for the AI Tutor
    ├── ai-server.js
    ├── package.json
    └── .env.example
```

Just open `index.html` in a browser, or serve the folder with any static host (Netlify, Vercel, GitHub Pages, nginx). No build step.

## What's covered now

- **6 full language lesson tracks**: JavaScript, Python, HTML &amp; CSS, Java, C++, SQL — each with several lessons, runnable examples, and a table of contents.
- **Lessons hub** (`lessons.html`) with sections for AI &amp; ML, cyber security, cloud computing, and blockchain — currently overview cards marked "in progress," ready to expand into full tracks the same way the language pages are structured. Go/Rust/PHP are listed on the hub as upcoming tracks.
- **Playground**: JavaScript, HTML, and CSS run **live** in the browser via a sandboxed iframe. Python, Java, C++, and SQL show real starter code with clearly labeled **sample output** (not live execution) — see below to make those live too.
- **AI Tutor**: a chat widget on every page.

## Making the AI Tutor live

The widget (bottom-right corner, every page) needs one of two things to actually reply:

**Option A — Backend proxy (recommended for a real deployment)**
```bash
cd server
npm install
cp .env.example .env     # then add your real ANTHROPIC_API_KEY
npm start                 # runs on http://localhost:3000
```
Serve the site itself from this same server (it already serves the static files too), and the widget's default endpoint (`/api/ask-ai`) works with no extra config. Your API key never reaches the browser.

**Option B — Direct-from-browser (quick local testing only)**
In the widget, open the ⚙ settings icon, switch to "Call Anthropic API directly," and paste an API key. This is clearly labeled as insecure in the UI — the key is stored in that browser's `localStorage` and visible in network requests. Don't use this for a public site.

## Making the code playground fully live for every language

Right now only JavaScript/HTML/CSS execute for real (the browser can do that natively). To run actual Python, Java, C++, or SQL, add a small backend endpoint that forwards code to a code-execution API — Judge0 and Piston are common free/open options — following the same pattern as `server/ai-server.js`, then update `js/playground.js`'s `run()` function to `fetch()` that endpoint instead of showing `SAMPLE_OUTPUT`.

## Extending lessons

Each language page follows the same template: hero, sticky table of contents, numbered `<section>` blocks with a heading, prose, and a `<pre><code>` example, and a pager linking back to the hub and the playground. Copy an existing page (e.g. `lessons/python.html`) as the starting point for a new language or topic, then add it to `lessons.html`, the homepage track grid, and `sitemap.xml`.

## SEO

Every page has a unique title, meta description, keyword list, canonical URL, Open Graph/Twitter tags, and (on the homepage, lessons hub, and lesson pages) JSON-LD structured data (`EducationalOrganization`, `ItemList`, `Course`). Update the `digitalenviro.com` placeholder domain throughout once you have a real one.

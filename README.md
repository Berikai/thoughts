# Thoughts 💭

A minimal, ultra-clean personal thoughts & essay site inspired by [timbaek.com/thoughts](https://timbaek.com/thoughts), featuring typography powered by **Google Sans** and **Google Sans Code**, served statically on **GitHub Pages**.

---

## ⚡ Features

* **Typography First**: Clean aesthetics with **Google Sans** for UI & prose, and **Google Sans Code** for code blocks and monospace elements.
* **Zero Framework Bloat**: No SvelteKit, Next.js, or client hydration bundles. 100% static HTML pages with instant load times (<10ms).
* **Dark / Light Mode Toggle**: One-click toggle button with automatic OS preference fallback and flicker-free `localStorage` persistence.
* **Markdown with Frontmatter**: Write articles in standard Markdown with title and date metadata.
* **Footnotes Support**: Built-in GitHub-flavored Markdown footnotes (`[^1]`).
* **Interactive Code Blocks**: Code blocks featuring language labels and an instant vanilla JS copy button.
* **Clean URLs**: Pre-rendered into directories (e.g. `/thoughts/new-thought/`), working out of the box with GitHub Pages.
* **Auto-Deploy on Push**: GitHub Actions workflow included for automated GitHub Pages deployment.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. The server watches `content/`, `templates/`, and `public/` and automatically rebuilds when you save changes.

### 3. Build for Production
```bash
npm run build
```
Generates 100% static HTML and assets into the `dist/` directory.

---

## ✍️ How to Add a New Thought

Simply create a new Markdown file inside `content/thoughts/<slug>.md`:

```markdown
---
title: "Your Thought Title"
date: "14 Oct 2026"
---

Write your thought here using standard Markdown.

### Subheadings Work Great

You can use **bold text**, *italics*, blockquotes, and even footnotes[^note].

```python
def hello():
    print("Google Sans Code looks great!")
```

---

## 🌐 Deploying to GitHub Pages

1. Push your repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
2. In your GitHub repository:
   * Go to **Settings** → **Pages**.
   * Under **Build and deployment** → **Source**, select **GitHub Actions**.
3. Every time you push to `main`, the included `.github/workflows/deploy.yml` workflow will automatically build and publish your site!

---

## 🎨 Customization

Edit `site.config.json` to change the site title, author name, and headings:

```json
{
  "title": "Thoughts",
  "author": "Your Name",
  "authorShort": "Your N.",
  "heading": "Your thoughts",
  "description": "Thoughts and reflections"
}
```


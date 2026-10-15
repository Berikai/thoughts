const fs = require('fs');
const path = require('path');
const yaml = require('yaml');
const { marked } = require('marked');
const markedFootnote = require('marked-footnote');
const markedKatex = require('marked-katex-extension');

// Load site configuration
const config = JSON.parse(fs.readFileSync('site.config.json', 'utf-8'));

// Configure marked with footnotes and LaTeX math (KaTeX)
marked.use(markedFootnote());
marked.use(markedKatex({
  throwOnError: false,
  nonStandard: true
}));

// Custom renderer for code blocks and external links
const renderer = {
  code({ text, lang }) {
    const language = lang || 'text';
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `
<div class="code-block-wrapper">
  <div class="code-header">
    <span class="code-lang">${language}</span>
    <button class="copy-btn" onclick="copyCode(this)" aria-label="Copy code">copy</button>
  </div>
  <pre><code class="language-${language}">${escaped}</code></pre>
</div>`;
  },
  link({ href, title, text }) {
    const isExternal = href.startsWith('http://') || href.startsWith('https://');
    const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
    const titleAttr = title ? ` title="${title}"` : '';
    return `<a href="${href}"${titleAttr}${targetAttr}>${text}</a>`;
  }
};

marked.use({ renderer });

// Helpers
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function parseMarkdownFile(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const match = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  
  if (match) {
    const frontmatter = yaml.parse(match[1]) || {};
    const body = match[2];
    return { frontmatter, body };
  }
  return { frontmatter: {}, body: fileContent };
}

// Parse human dates (e.g. "09 Aug 2026", "18 May 2023", "3 Apr 2023")
function parseDate(dateStr) {
  const timestamp = Date.parse(dateStr);
  return isNaN(timestamp) ? 0 : timestamp;
}

function build() {
  const distDir = path.join(__dirname, 'dist');
  
  // Clean & recreate dist
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });

  // Copy public static assets
  if (fs.existsSync('public')) {
    copyDirSync('public', distDir);
  }

  // Load templates
  const baseTpl = fs.readFileSync('templates/base.html', 'utf-8');
  const indexTpl = fs.readFileSync('templates/index.html', 'utf-8');
  const postTpl = fs.readFileSync('templates/post.html', 'utf-8');
  const themeToggleTpl = fs.readFileSync('templates/theme-toggle.html', 'utf-8');

  // Read thoughts
  const thoughtsDir = path.join(__dirname, 'content/thoughts');
  const files = fs.readdirSync(thoughtsDir).filter(f => f.endsWith('.md'));
  
  const posts = files.map(file => {
    const slug = path.basename(file, '.md');
    const { frontmatter, body } = parseMarkdownFile(path.join(thoughtsDir, file));
    return {
      slug,
      title: frontmatter.title || slug,
      date: frontmatter.date || '',
      body,
      timestamp: parseDate(frontmatter.date)
    };
  });

  // Sort newest first
  posts.sort((a, b) => b.timestamp - a.timestamp);

  // Render Post Pages
  for (const post of posts) {
    const postHtmlBody = marked.parse(post.body);
    const postContent = postTpl
      .replace(/{{title}}/g, post.title)
      .replace(/{{date}}/g, post.date)
      .replace(/{{postBodyHtml}}/g, postHtmlBody)
      .replace(/{{themeToggle}}/g, themeToggleTpl);

    const postFullHtml = baseTpl
      .replace(/{{pageTitle}}/g, `${post.title} / ${config.authorShort}`)
      .replace(/{{description}}/g, config.description)
      .replace(/{{assetsPath}}/g, '../../')
      .replace(/{{content}}/g, postContent)
      .replace(/{{spotifyHeading}}/g, config.spotifyHeading || `${config.authorShort || 'Eren'}'s listening`);

    const postOutDir = path.join(distDir, 'thoughts', post.slug);
    fs.mkdirSync(postOutDir, { recursive: true });
    fs.writeFileSync(path.join(postOutDir, 'index.html'), postFullHtml, 'utf-8');
  }

  // Render Index Pages (Root '/' and '/thoughts/')
  function generateIndex(relativeToThoughts, assetsPath) {
    const postsListHtml = posts.map(post => {
      const url = relativeToThoughts ? `${post.slug}/` : `thoughts/${post.slug}/`;
      return `  <div class="post-item">
    <a href="${url}" class="post-title-link">
      <div>${post.title}</div>
    </a>
    <div class="post-date">${post.date}</div>
  </div>`;
    }).join('\n');

    const indexContent = indexTpl
      .replace(/{{heading}}/g, config.heading)
      .replace(/{{postsListHtml}}/g, postsListHtml)
      .replace(/{{themeToggle}}/g, themeToggleTpl);

    return baseTpl
      .replace(/{{pageTitle}}/g, `${config.title} / ${config.authorShort}`)
      .replace(/{{description}}/g, config.description)
      .replace(/{{assetsPath}}/g, assetsPath)
      .replace(/{{content}}/g, indexContent)
      .replace(/{{spotifyHeading}}/g, config.spotifyHeading || `${config.authorShort || 'Eren'}'s listening`);
  }

  // 1. Root index.html
  fs.writeFileSync(path.join(distDir, 'index.html'), generateIndex(false, './'), 'utf-8');

  // 2. /thoughts/index.html
  const thoughtsIndexDir = path.join(distDir, 'thoughts');
  fs.mkdirSync(thoughtsIndexDir, { recursive: true });
  fs.writeFileSync(path.join(thoughtsIndexDir, 'index.html'), generateIndex(true, '../'), 'utf-8');

  console.log(`✓ Built successfully! Generated ${posts.length} posts into dist/`);
}

build();


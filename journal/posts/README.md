# Posting to the journal

Drop a markdown file in this folder and run:

```
node tools/build-journal.mjs
```

That writes `journal/index.html`, a folder per post, and `feed.xml`. Commit
what it produces along with your `.md` file — the site has no build step on
the server, so the generated pages are the site.

Then run `node tools/build-seo.mjs` so the sitemap picks up the new address.

## The frontmatter

```
---
title: What the lab sent back        (required)
date: 2022-04-02                     (required, YYYY-MM-DD)
summary: One sentence.               (shown in search results and the RSS feed)
cover: images/latent-01.jpg          (optional; also the social preview image)
coverAlt: What is in the picture     (for screen readers — write it if there is a cover)
tags: 35mm, process                  (optional, comma separated)
slug: custom-address                 (optional; defaults to the title)
draft: true                          (optional; keeps it out of the build entirely)
---
```

Leave a field out rather than filling it in with something approximate. An
absent `summary` falls back to your opening sentences; an absent `cover` just
means no cover.

## The markdown

Headings (`##`, `###`, `####`), paragraphs, `**bold**`, `*italic*`,
`[links](https://…)`, `` `code` ``, block quotes (`>`), bulleted and numbered
lists, and `---` for a rule.

An image on a line of its own becomes a full plate with a caption:

```
![A red light leak across a bare arm](images/latent-01.jpg)
```

Image and link paths are written from the repository root — `images/…`, not
`../../images/…`. The builder fixes them up for whatever address the post
ends up at.

If you need something the list above does not cover, write the HTML directly:
any block that starts with `<` is passed through untouched.

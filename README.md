# jetspecpp-web

The project website for JetSpec++: Foresight Parallel Drafting with Self Refinements ([arXiv 2610.19792](https://arxiv.org/abs/2610.19792)).

This repository stays private until the release. The site is static HTML, CSS and JavaScript with no build step. When the repository becomes public, GitHub Pages serves `main` at `https://jetspec-project.github.io/jetspecpp-web/`.

## Preview

Serve the repository root with any static file server and open `index.html`:

```bash
python3 -m http.server 8000
```

## Page

The page follows the layout of the JetSpec site:

1. Header: name, title, authors, affiliations and links, then a lead paragraph and the overview video.
2. Approach: the mechanism video, then pipelining, foresight drafting (adapter and decoder), self refinement and lossless, with the paper's Figure 2.
3. Serving: decode speed (paper, Table 3), as a table.
4. Acceptance: tokens per round on seven benchmarks (paper, Tables 1 and 2), as a table, then cost and limitations.
5. BibTeX.

`data.js` holds the paper's numbers, and `site.js` builds the tables from it.

## Videos and themes

The page has a light and a dark theme. The button in the top bar switches them, and the choice is stored in the browser; without a stored choice the page follows the operating system. Each video slot names one file per theme, and the page plays the file of the current theme:

- `media/overview-light.mp4` and `media/overview-dark.mp4` (the hero)
- `media/mechanism-light.mp4` and `media/mechanism-dark.mp4` (the mechanism, at the top of the approach section)

Until a file exists, its slot shows "in preparation".

Every number on the page comes from the paper (arXiv 2610.19792), except the FP4 headline number, a measured fast-engine run that the paper does not report. The figure is the paper's Figure 2. The code is at [hao-ai-lab/JetSpec](https://github.com/hao-ai-lab/JetSpec), and the JetSpec site is [jetspec-project.github.io/jetspec-web](https://jetspec-project.github.io/jetspec-web/).

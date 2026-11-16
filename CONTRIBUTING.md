# Contributing to PromptArchitect

Thanks for wanting to help! 🎉 Every contribution is welcome: bug reports, ideas, docs, translations and code.

By taking part you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to help

- ⭐ **Star the repo.** It genuinely helps other people find it.
- 🐛 **Report a bug** with the [bug report form](https://github.com/reseachrandomv/promptarchitect/issues/new?template=bug_report.yml).
- 💡 **Suggest a feature** with the [feature request form](https://github.com/reseachrandomv/promptarchitect/issues/new?template=feature_request.yml), or start a thread in [Discussions](https://github.com/reseachrandomv/promptarchitect/discussions).
- 🧑‍💻 **Pick up an issue.** Look for [`good first issue`](https://github.com/reseachrandomv/promptarchitect/labels/good%20first%20issue) and [`help wanted`](https://github.com/reseachrandomv/promptarchitect/labels/help%20wanted).

Comment on an issue before you start so nobody duplicates work.

## Project principles

- Keep it **three static files** with **no build step** and **no npm dependencies**.
- **No server and no paid APIs.** Everything runs client-side; prompts must never leave the browser.
- Keep the three compilers (`compileMarkdown()`, `compileXml()`, `compileJson()`) in sync: a new field must appear in every output format and in the exports.

## Project layout

The app is `index.html` (layout), `styles.css` (styles) and `app.js` (all logic). There is no framework, bundler or package manager.

| Area | Where to look |
|---|---|
| New built-in template | `BUILTIN_TEMPLATES` in `app.js` plus a matching `data-template` button in `index.html` (both the header menu and the Template Library section). |
| Output formats | `compileMarkdown()`, `compileXml()`, `buildJsonSchemaObject()` and the exporters `buildSkillMd()` / `buildJsonTemplate()` in `app.js`. |
| Metrics | `computeMetrics()` in `app.js` (the token count is a documented heuristic, not a real tokenizer). |
| Persistence | `STORAGE_KEYS`, `saveDraftNow()`, `loadCustomTemplates()` in `app.js`. |

## Local development

```bash
git clone https://github.com/reseachrandomv/promptarchitect.git
cd promptarchitect
python3 -m http.server 8080   # or any static server, then open http://localhost:8080
```

You can also open `index.html` directly, but a local server gives you the modern Clipboard API.

## Pull request checklist

1. Fork the repo and create a branch: `git checkout -b feat/short-description`.
2. Keep PRs small and focused on one change.
3. Test in at least two browsers (e.g. Chrome and Firefox), at desktop and phone widths.
4. Open DevTools and confirm there are **no console errors** and **no new network requests**.
5. Check keyboard access: every new control must be reachable with <kbd>Tab</kbd> and have a visible focus ring.
6. Update `README.md` if you change behaviour, shortcuts, patterns or templates.
7. Fill in the pull request template.

## Commit messages

Short, imperative messages are great: `Add Stripe restricted key pattern`, `Fix focus ring on mode switcher`. Prefixes like `feat:`, `fix:` and `docs:` are welcome but not required.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

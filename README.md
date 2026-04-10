# 🔖 Max' Bookmarks App

A "ranked" bookmarks managing application.
A personal project to tinker with and use in my free time.

## ✨ Features

- 🔎 Fuzzy search
- 🏷️ Tagging
- ✏️ Editing
- ⚔️ Sorting of bookmarks via 1 VS. 1 voting (using [Wilson Score](https://en.wikipedia.org/wiki/Binomial_proportion_confidence_interval#Wilson_score_interval))
- 📁 Multiple "database" tables
- 🗄️ Automatic backup on boot
- 📊 "Statistics"
- 🎨 Random UI color

## 🔨 Tech

<a href="https://gitmoji.dev">
  <img
    src="https://img.shields.io/badge/gitmoji-%20😜%20😍-FFDD67.svg?style=flat"
    alt="Gitmoji"
  />
</a>

### 🖼️ Front-End

- Folder: `/client`
- Framework: [Svelte](https://svelte.dev)
- Wilson score sorting: [decay](https://github.com/clux/decay)
- Fuzzy search: [Fuse.js](https://fusejs.io)
- State management: [RxJS](https://rxjs.dev)
- Utility: [lodash](https://lodash.com)
- Icons: [Lucide](https://lucide.netlify.app)

### ⚙️ Back-End

- Folder: `/server`
- API: [tRPC](https://trpc.io/)
- "Database": [lowdb](https://github.com/typicode/lowdb)
- IDs: [nanoid](https://github.com/ai/nanoid)
- Object validation: [ArkType](https://arktype.io)

## ▶️ How To Use

```bash
npm install
npm start
```

Uses [concurrently](https://github.com/open-cli-tools/concurrently) to run both the client and server in parallel.

### 📄 Adding bookmarks

Currently the only way to add bookmarks is to import via some JSON in the following format:

```json
[
	{
		"title": "GitHub",
		"url": "https://github.com"
	},
	{
		"title": "Google",
		"url": "https://google.com"
	}
]
```

### 📁 Adding tables

The server watches the `/server/database/tables` directory for changes, so you can add and removes tables on the fly without restarting the server.

See `/server/database/tables/example.json` for an example. The application uses the name of the file as the title of the table.

Here's a minimal example:

```json
{
	"emoji": "🔖",
	"bookmarks": [],
	"votes": [],
	"categories": []
}
```

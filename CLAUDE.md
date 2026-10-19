# CLAUDE.md — Règles de développement Stratly

## Règle absolue : vérification avant tout commit

**Toujours lancer `npm run check` avant de committer.** Ne jamais contourner le hook.

```bash
npm run check
# = tsc --noEmit && vitest run && next build
```

Si le check échoue → corriger les erreurs avant de committer. Ne jamais utiliser `--no-verify`.

## Sécurité

- **Jamais de token GitHub en clair** dans une commande `git push`. Utilise simplement `git push` sans URL ni token.
- **Jamais de force push** (`git push --force`), sauf demande explicite de l'utilisateur.
- **Jamais commiter de fichier client** (fichiers de test, données réelles, credentials).
- Les variables d'environnement sensibles restent dans `.env.local` (non commité).

## Tests

- Les tests Vitest sont dans `__tests__/`.
- Aucun appel réseau réel ni appel à l'API Claude dans les tests — tout est simulé (vi.mock / données en mémoire).
- Les fichiers de test XLSX/Word sont créés en mémoire via ExcelJS/JSZip — ne jamais utiliser de vrais fichiers clients.

## Structure lib/

Les fonctions pures testables sont dans `lib/` :
- `lib/analyse/extraire.ts` — extraction de texte multi-format, expansion ZIP
- `lib/bibliotheque/parseHtmlBlocs.ts` — parsing HTML → blocs structurés (Node.js, sans DOMParser)
- `lib/memoire/markdownToDocx.ts` — conversion markdown → instructions docx
- `lib/chiffrage/` — matching, classification feuilles, lecture Excel

## Commits

Format : `type(scope): message` — ex. `fix(chiffrage): correction formule PSE`

Types : `fix`, `feat`, `refactor`, `test`, `docs`, `chore`

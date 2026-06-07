# Ahnenforschung

Moderne, mandantenfähige Stammbaum-Web-App mit Next.js, TypeScript, Tailwind CSS, NextAuth, PostgreSQL, Prisma und React Flow.

## Features

- Google OAuth Login mit NextAuth und Prisma-Adapter
- Optionaler Magic-Link Login per SMTP
- Automatische Tenant-Erstellung beim ersten Login
- Echtes Tenant-Modell mit `OWNER`, `ADMIN`, `EDITOR`, `VIEWER`
- Tenant-isolierte Stammbaum-, Personen-, Beziehungs-, Quellen-, Medien- und Audit-Daten
- Visueller React-Flow-Editor mit Drag&Drop, Mini-Map, Zoom, Pan und Fit View
- Personen-Detailpanel mit Datenschutzstatus, Tags, Biografie, Orten, Beruf und Custom-Data-Feld
- Farbig unterscheidbare Beziehungstypen mit Metadaten
- Auto-Save, manuelles Speichern, Undo/Redo, Kontextmenü und Tastaturkürzel
- JSON Import/Export, PNG Export und Druck/PDF-Ausgabe über den Browser
- Mitgliederverwaltung, Einladungen, Rollenwechsel und Audit-Log
- Quellen- und Medien-API mit Upload-Validierung
- Plausibilitätsprüfungen für Daten, Eltern-Kind-Beziehungen, Zyklen und Duplikate
- Dashboard, Tenant-Auswahl, Profil, Einstellungen, Audit-Ansicht und responsive Dark-Mode-UI

## Voraussetzungen

- Node.js 22 oder neuer
- npm 10 oder neuer
- PostgreSQL 16 oder neuer
- Google OAuth Client für produktiven Login

## Lokaler Start

```bash
cp .env.example .env
docker compose up -d postgres
npm install
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm run dev
```

Die App läuft danach unter `http://localhost:3000`.

## Environment Variables

Pflicht:

- `DATABASE_URL`: PostgreSQL-Verbindung
- `NEXTAUTH_URL`: lokale oder produktive Basis-URL
- `NEXTAUTH_SECRET`: mindestens 32 zufällige Bytes
- `GOOGLE_CLIENT_ID`: Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth Secret

Optional:

- `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD`, `EMAIL_FROM`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`
- `UPLOAD_DIR`
- `MAX_UPLOAD_MB`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX`

Keine Secrets gehören in Git. Die alte Beispiel-README enthielt ein Klartext-Datenbankpasswort; dieses wurde bewusst entfernt.

## Datenbank

Prisma-Schema: `prisma/schema.prisma`

Migrationen:

```bash
npx prisma migrate dev
```

Produktionsdeployment:

```bash
npx prisma migrate deploy
```

Seed-Daten:

```bash
npm run db:seed
```

Der Seed erstellt:

- Tenant `Demo Familie`
- Demo-Benutzer `owner.demo@example.test`, `editor.demo@example.test`, `viewer.demo@example.test`
- Beispiel-Stammbaum `Chronik der Familie Morgenstern`
- mehrere Generationen, Beziehungen, Quellen, Medienmetadaten, Custom Field und Audit-Logs

Die Demo-Benutzer sind Datenbank-Testdaten. Für echten Login wird Google OAuth oder optional Magic Link benötigt.

## Rollenmodell

- `OWNER`: vollständige Verwaltung inklusive Owner-Rollen
- `ADMIN`: Mitglieder, Einladungen, Audit und Inhalte verwalten, aber keine Owner-Rechte eskalieren
- `EDITOR`: Stammbäume, Personen, Beziehungen, Quellen und Medien bearbeiten
- `VIEWER`: lesen, aber keine Mutationen ausführen

Jede API-Mutation prüft Authentifizierung, Tenant-Zugriff und Rolle.

## Editor-Kürzel

- `Entf`: ausgewählte Person oder Beziehung löschen
- `Ctrl+S`: speichern
- `Ctrl+Z`: rückgängig
- `Ctrl+Y`: wiederholen
- Rechtsklick auf Node: Kontextmenü

## Tests

```bash
npm test
```

Enthalten sind Tests für:

- Zod-Validierungen
- Rollen- und Rechteprüfung
- Tenant-Isolation-Helper
- Beziehungserstellung und Zyklus-Schutz
- Plausibilitätsregeln

## Security-Hinweise

- Authentifizierung über NextAuth mit OAuth/Magic Link
- Sessions werden serverseitig über Prisma verwaltet
- Prisma schützt vor SQL Injection
- Zod validiert API-Eingaben
- React escaped UI-Ausgaben standardmäßig gegen XSS
- Uploads prüfen Dateityp, Größe und gefährliche Erweiterungen
- Kritische Endpunkte haben In-Memory Rate Limiting
- Audit-Logs dokumentieren Login, Erstellung, Änderungen, Löschungen, Einladungen, Rollen und Import/Export
- Viewer dürfen nicht mutieren; Editor darf keine Mitglieder verwalten
- Fehlerantworten geben keine internen Details aus

Für hohe Produktionslast sollte das In-Memory Rate Limiting durch Redis oder einen Edge/WAF-Layer ersetzt werden.

## Deployment

Docker ist vorbereitet:

```bash
docker build -t ahnenforschung .
```

Für Produktion:

1. PostgreSQL bereitstellen
2. Secrets als Environment Variables setzen
3. `npx prisma migrate deploy` ausführen
4. App mit `npm run build` und `npm run start` starten

## Sinnvolle nächste Erweiterungen

- GEDCOM Import/Export
- Redis-basiertes Rate Limiting
- S3-kompatibler Medienspeicher
- E-Mail-Templates und Zustellstatus
- 2FA-Flow
- E2E-Tests für OAuth-Strecken mit Playwright

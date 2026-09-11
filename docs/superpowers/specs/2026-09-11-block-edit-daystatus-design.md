# Elastic Planner v1.25: dagstatus-bugg, inline-redigering, tidiga timmar, förra söndagen

Datum: 2026-09-11. Godkänd av Ola i chatt (designdiskussion, sedan "kör").

## 1. Bugg: dagstatus (J/H/L) glöms

**Orsak (tre ställen):**
1. `updateCurrentWeek` i App.jsx skriver `{calendar, points}` för veckan och tappar `dayStatuses` redan i React-state vid varje blockändring.
2. `saveWeek` i plannerDB.js skickar bara `calendar` till Firestore.
3. `saveWeekToLocalStorage` skriver `{calendar}` till samma localStorage-nyckel (`elastic-planner-weeks`) som App.jsx nyss skrivit hela veckodatat till, och stryker då `dayStatuses` + `points` för aktuell vecka.

**Fix:**
- `updateCurrentWeek` bevarar övriga fält i veckoobjektet (`...prev[week]`).
- `saveWeek(weekId, weekData)` tar hela veckoobjektet och sparar `{calendar, points, dayStatuses}` till Firestore; localStorage-hjälparen slår ihop med befintligt (behåller okända fält).
- `loadWeek` returnerar hela objektet `{calendar, points, dayStatuses}` (eller `null` om inget finns). Anroparna slår ihop med lokalt state: fält som saknas i Firestore-dokumentet (gamla dokument) behålls från lokalt.
- `migrateFromLocalStorage` skickar med `points` och `dayStatuses`.

## 2. Inline-redigering via penna och dubbelklick

- Hover-ikonen i blockets hörn: pratbubblan (anteckning) ersätts av en penna (`Edit3`).
- Penna eller dubbelklick på blocket sätter blocket i inline-läge: namn (input) och beskrivning (textarea, visas bara om blocket är minst 1 h högt) redigeras direkt i blocket.
- Enter i namnfältet sparar. Escape avbryter utan att spara. Klick utanför sparar.
- Projekt/uppgift/tid ändras fortfarande i dialogen (kugghjulet i markerings-menyn).
- Anteckning (pratbubbla) finns kvar i markerings-menyn, orörd.
- Delete/Backspace-genvägen för att radera markerade block ska inte trigga när fokus ligger i ett input/textarea.

## 3. Visa tidiga timmar (00–07)

- Knapp överst i tidskolumnen: `▲ 00–07` (av) / `▼ 00–07` (på). Valet sparas i localStorage `ep_show_early_hours`.
- På: timmarna 0–6 renderas i full höjd ovanför 07:00, med samma halvtimmes-slots (klick = lägg till block) och drop-targets som övriga timmar. Block med `start < 7` positioneras `top = start * HOUR_HEIGHT`, och den hopklämda "sena" zonen i botten döljs.
- Av: som idag (hopklämd zon i botten om nattblock finns).
- Alla `(x - 7) * HOUR_HEIGHT`-beräkningar (block, drop-indikator, nu-linje, punkter, markerings-meny) går via en gemensam `hourToRem(hour)` som tar hänsyn till läget. Nu-linjen visas även före 07 när läget är på.

## 4. Förra veckans söndag som kantkolumn

- Vänster om måndagen renderas en dämpad extra kolumn: förra veckans söndag (rubrik `SÖN` + datum + `v.N-1`). Visas bara när `currentWeekIndex > 1`.
- Data: `weeksData[currentWeekIndex - 1]` om det finns i state, annars laddas den från Firestore/localStorage när veckan byts (samma `loadWeek`).
- Kolumnen är läs-läge: inga klick-slots, inga hover-knappar, ingen resize, ingen markering. Blocken går att dra.
- Drag från kantkolumnen är alltid kopiering: blocket får nytt id, originalet rörs inte. Hanteras i `handleDragStart` med flaggan `_fromOtherWeek` som tvingar duplicering i `handleDrop`.
- Grid går från 8 till 9 kolumner, `min-w` ökar med en kolumn.

## Version och dokumentation

- `APP_VERSION` och package.json till 1.25.0. CHANGELOG-post per punkt.
- Branch `feat/v1.25-block-edit-daystatus`, PR mot main enligt projektets CLAUDE.md.

## Verifiering

Ingen testsvit finns. Verifiering: `npm run build` utan fel, sedan klicka igenom i dev-servern: sätt H på en dag, flytta ett block, ladda om (status kvar); penna/dubbelklick; toggla 00–07 och lägg block 03:00; dra block från förra söndagen in i måndagen.

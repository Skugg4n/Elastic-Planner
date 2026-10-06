# Hur veckor lagras och synkas (v1.29+)

## Veckoindex
En vecka identifieras av ett löpande heltal (`src/weeks.js`): 1 = ISO-vecka 2026-W01 (måndag 2025-12-29),
53 = 2026-W53, 54 = 2027-W01. Under 2026 är indexet lika med ISO-veckonumret. Firestore-dokumentet
ligger på `planner/{uid}/weeks/{index}` och bär `isoYear`, `isoWeek`, `monday` som läsbar beskrivning.
Backend (nexus `firebase/functions/planner-week.js`) måste räkna på samma sätt.

## Synk
- `src/weekMerge.js`: jämför och slår ihop veckor per block (trevägs: bas, lokal, moln). Lokal ändring vinner
  över molnändring på samma block. Allt annat från båda sidor behålls. Radering här vinner över ändring i molnet.
- `src/weekSync.js`: styr synken. Lyssnar på hela `weeks`-samlingen, håller reda på vilka veckor som har
  osparade lokala ändringar ("dirty") och vilken version de utgick från ("bas"), skriver med transaktion,
  försöker igen vid fel. Dirty + bas sparas i localStorage (`elastic-planner-sync:{uid}`) och överlever omstart.
- `src/plannerDB.js` `weeksAdapter`: Firestore-kopplingen (onSnapshot, runTransaction, säkerhetskopior).
- `App.jsx`: skickar varje ändring av `weeksData` till synken, tar emot molnändringar via `applyWeeks`.
  localStorage (`elastic-planner-weeks`) är bara en cache.

## Förslag (v1.30+)
Veckodokumentet har också `suggestions`: föreslagna block som inte är en del av kalendern förrän användaren
godkänner dem i appen. Samma fält som ett block plus `reason` (visas som tooltip) och `source` (vem som föreslog).
Backend lägger in dem via `addSuggestions` i nexus `planner-write.js` (API: `POST action=suggest`,
CLI: `node planner-cli.js suggest '{...}'`). Godkännande flyttar posten till `calendar` med `suggestedBy`.

## Tidur (v1.31+)
Den pågående tidtagningen ligger i `planner/{uid}/state/timer` och delas mellan appen och Raycast-extensionen
Elastic Tid (`~/raycast-extensions/elastic-tid`, via nexus `planner-api.js`). Appen lyssnar på dokumentet
(`subscribeTimer`) och startar/stoppar med transaktioner (`startTimerTx`, `stopTimerTx` i `plannerDB.js`) som
skriver blocket direkt i veckodokumentet. Synken hämtar sedan in blocket som vilken molnändring som helst.
En angiven sluttid som ligger före starten (eller under fem minuter efter) ger `tooEarly` utan att något
skrivs eller stoppas; en bortglömd timer (över tolv timmar) ger `needsEndTime` både vid stopp och vid start,
ingen tid slängs utan att användaren valt det.

Reglerna (5 minuter, halvtimmar, förlängning, 12 timmar, Okonterat) finns i `src/timer.js` och MÅSTE vara
desamma som i nexus `firebase/functions/planner-timer.js`.

## Regler att hålla
- Skriv aldrig en vecka till molnet för att den visas. Bara faktiska lokala ändringar skrivs.
- Mutera aldrig block på plats. Äldre versioner delas med ångra-historiken och synkens bas.
- Nya block, punkter och låd-poster får id via `uid()`.
- Ändras veckomodellen: uppdatera både `src/weeks.js` och nexus `planner-week.js`, och kör `npm test`.

## Testa
`npm test` för logiken. `npm run emulators` + `npm run dev:emulator` för riktig synk mellan två flikar
(`localhost:5179` och en andra dev-server på annan port är två "enheter"), se `dev/README.md`.

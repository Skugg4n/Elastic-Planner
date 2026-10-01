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

## Regler att hålla
- Skriv aldrig en vecka till molnet för att den visas. Bara faktiska lokala ändringar skrivs.
- Mutera aldrig block på plats. Äldre versioner delas med ångra-historiken och synkens bas.
- Nya block, punkter och låd-poster får id via `uid()`.
- Ändras veckomodellen: uppdatera både `src/weeks.js` och nexus `planner-week.js`, och kör `npm test`.

## Testa
`npm test` för logiken. `npm run emulators` + `npm run dev:emulator` för riktig synk mellan två flikar
(`localhost:5179` och en andra dev-server på annan port är två "enheter"), se `dev/README.md`.

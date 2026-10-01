# Lokal testmiljö (Firebase-emulatorer)

För att testa synk mellan flera "enheter" utan att röra riktig data.

1. Starta emulatorerna (kräver Java och firebase-tools):
   `npm run emulators`
2. Starta appen mot emulatorerna:
   `npm run dev:emulator`
3. Öppna `http://localhost:5179` och `http://127.0.0.1:5179` i två flikar. De har var sin
   lokala lagring, alltså två enheter. "Logga in" loggar in testkontot från `.env.emulator`.

Enhetstester (veckoräkning, sammanslagning, synk): `npm test`.

# Megye tanuló játék

*Interaktív magyar megye- és megyeszékhely-tanuló játék, statikus weblapon.*

*An interactive Hungarian county and county-seat learning game, built as a static web page.*

---

## Magyar leírás

### Célja

A **Megye tanuló játék** egy böngészőben futó, ingyenes és regisztráció nélküli oktató játék, amelynek célja Magyarország 19 megyéjének, Budapestnek és a megyeszékhelyeknek a megtanítása interaktív térkép segítségével. A játék elsősorban a térbeli felismerést gyakoroltatja: a tanuló nem csak neveket memorizál, hanem a térképen is meg kell találnia a megfelelő területet vagy pontot.

### Játékmódok

| Mód | Leírás |
|---|---|
| Megye tanulás – könnyített | Válassz egy megyenevet, majd kattints a térképen a megfelelő területre. Azonnali visszajelzés. |
| Megye tanulás – nehezített | Helyezd el az összes megyenevet, majd egyszerre ellenőrizd a válaszaidat. |
| Megyeszékhely tanulás – könnyített | A megyék nevei láthatók a térképen, segítségként a székhelyek megtanulásához. |
| Megyeszékhely tanulás – nehezített | A megyék nevei nem látszanak; minden válasz azonnal kiértékelődik. |
| Megyeszékhely tanulás – extrém | A megyék nevei nem látszanak, és minden székhelyet egyszerre kell elhelyezni. |

### Visszajelzés

- Helyes válasz esetén a megfelelő terület/pont zöldre vált, és egy rövid, kellemes hangjelzés hallható (beépített böngésző-hangokkal, letöltés nélkül).
- Helytelen válasz esetén rövid animáció és egy alacsonyabb figyelmeztető hang jelzi a hibát.
- A hangok kikapcsolhatók a böngésző hangnémítási beállításával; hiányukban a játék továbbra is teljes értékűen működik.

### Architektúra

A játék szándékosan **függőségek nélküli, statikus weboldal**, amely build-lépés nélkül futtatható:

- **`index.html`** – a játék szerkezete (menü, játéktér, párbeszédablak).
- **`styles.css` / `responsive.css`** – alap és reszponzív megjelenés; a térkép és a megye-/székhely-lista mindig teljesen látható marad, görgetés nélkül.
- **`app.js`** (ES-modul) – a játék állapotát és logikáját kezeli: módválasztás, kattintáskezelés, pontszámítás, hangjelzés.
- **`data.js`** – a `counties.json` betöltése és validálása.
- **`counties.json`** – minden megye SVG-poligonja, névfelirat-pozíciója és székhely-pozíciója.
- **`placement.js`** – geometriai segédfüggvények: pont-a-sokszögben teszt és ütközéskerülő keresés, amely biztosítja, hogy a felcímkék és lehelyezett buborékok a megye határain belül maradjanak, és ne fedjék egymást vagy a székhelypontokat.
- **`layout.js`** – az SVG alapállapotának visszaállítása újrarajzolás után.
- **`viewport.js`** – a játéktér méretét futásidőben a látható nézethez igazítja, hogy a térkép és a lista görgetés nélkül elférjen.
- **`zoom.js`** – kicsinyítés/nagyítás (gombokkal, egérgörgővel és mobilon csippentéssel), rögzített 50–200%-os tartományban.
- **`reset.js`** – a játék visszaállítási logikája módváltáskor vagy újrakezdéskor.

Nincs szerveroldali komponens, adatbázis vagy build-eszköz; a projekt közvetlenül futtatható **GitHub Pages**-en vagy bármely statikus fájlkiszolgálón.

### Futtatás fejlesztés közben

```bash
git clone https://github.com/jaanos-zsoldos/megye-tanulas.git
cd megye-tanulas
python3 -m http.server 8000
# nyisd meg: http://localhost:8000
```

Nincs szükség `npm install`-ra vagy build-lépésre.

---

## English description

### Purpose

**Megye tanuló játék** ("County Learning Game") is a free, registration-free, browser-based educational game that teaches Hungary's 19 counties, Budapest, and their county seats through an interactive map. The game is built around spatial recognition rather than rote memorization: learners must locate the correct region or point on the map, not just recall a name.

### Game modes

| Mode | Description |
|---|---|
| County learning – easy | Pick a county name, then click the matching region on the map. Immediate feedback. |
| County learning – hard | Place every county name, then check all answers at once. |
| County seat learning – easy | County names are shown on the map as a learning aid for the seats. |
| County seat learning – medium | County names are hidden; every answer is evaluated immediately. |
| County seat learning – extreme | County names are hidden, and every seat must be placed before checking all at once. |

### Feedback

- A correct answer highlights the target region/point in green and plays a short, pleasant confirmation tone (built with the browser's native Web Audio API — no downloaded audio files).
- An incorrect answer triggers a brief highlight animation and a short, low warning tone.
- Sounds respect the browser's mute settings and are entirely optional; the game works fully without audio.

### Architecture

The project is intentionally a **dependency-free static website** that needs no build step:

- **`index.html`** – overall game structure (menu, game screen, dialog).
- **`styles.css` / `responsive.css`** – base and responsive styling; the map and the county/seat pill list always stay fully visible without page scrolling.
- **`app.js`** (ES module) – game state and logic: mode selection, click handling, scoring, and audio feedback.
- **`data.js`** – loads and validates `counties.json`.
- **`counties.json`** – SVG polygon, label position, and seat position for every county.
- **`placement.js`** – geometry helpers: a point-in-polygon test and a collision-avoiding search that keep county-name labels and placed pills inside county borders and clear of each other and of seat dots.
- **`layout.js`** – restores baseline SVG visual state after redraws.
- **`viewport.js`** – fits the game screen to the visible viewport at runtime so the map and list never require scrolling.
- **`zoom.js`** – zoom in/out via buttons, mouse wheel, or pinch gestures, clamped to a fixed 50%–200% range.
- **`reset.js`** – reset logic invoked when switching modes or restarting.

There is no server-side component, database, or build tool; the project can be served directly from **GitHub Pages** or any static file host.

### Local development

```bash
git clone https://github.com/jaanos-zsoldos/megye-tanulas.git
cd megye-tanulas
python3 -m http.server 8000
# open: http://localhost:8000
```

No `npm install` or build step is required.

# Dance Revolution EF · Mentoria 4.0 Tarragonès

Web estàtica per presentar Dance Revolution EF, jugar a Scratch i consultar recursos didàctics. La pàgina es publica amb GitHub Pages; no utilitza backend ni transmet respostes automàticament.

## Estructura

- `index.html`: contingut i navegació accessible.
- `css/styles.css`: disseny adaptable i estètica arcade.
- `js/main.js`: navegació, formulari i representació del mural.
- `community-responses.json`: respostes revisades que s'exposen públicament al mural.
- `fotos/`: logos de Mentories 4.0 i del programa educatiu.

## Com funcionen les aportacions

El formulari prepara un correu amb les respostes. La web no les desa ni les envia a un servidor: cal que el centre obri el correu, el revisi i l'enviï. No incloguis dades personals de l'alumnat. El nom del centre només es rep al correu de l'equip i no forma part del fitxer públic.

Després de revisar la resposta, obre **Gestiona el mural** i introdueix `DanceTGN` als dos camps de la primera configuració. A continuació, fes servir **Obre community-responses.json** per triar el fitxer del repositori. Pots afegir, editar o esborrar les respostes des de la pàgina i prémer **Desa el fitxer JSON** per escriure els canvis directament al fitxer local. El navegador demanarà permís per obrir i desar el fitxer. Si no permet l'escriptura directa, es descarregarà una còpia per substituir manualment.

El navegador desa un verificador de contrasenya amb sal a l'emmagatzematge local; la contrasenya no s'inclou al repositori. Aquest bloqueig només és una comoditat local, no una autenticació segura: el lloc i el JSON són públics i l'accés al codi client es pot inspeccionar. La contrasenya tampoc no protegeix el fitxer del repositori.

Obre la web mitjançant GitHub Pages o `http://localhost:8000`; l'escriptura directa de fitxers està disponible en navegadors compatibles amb File System Access API, com Chrome o Edge en orígens segurs (HTTPS o localhost). Després de desar el fitxer local del repositori, fes commit i push perquè GitHub Pages publiqui els canvis. A Firefox/Safari o altres navegadors sense aquesta API, la web baixa una còpia JSON per substituir manualment. Qualsevol dada dins del fitxer és pública i no es pot esborrar de còpies, branques o cachés que ja s'hagin fet.

## Provar la pàgina localment

Des de la carpeta del repositori:

```powershell
python -m http.server 8000
```

Obre `http://localhost:8000`. El mural llegeix `community-responses.json` de la mateixa carpeta i el navegador no desa dades al dispositiu.

GitHub Pages publica automàticament la carpeta del repositori amb `.github/workflows/pages.yml`.

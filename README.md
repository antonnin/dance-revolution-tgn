# Dance Revolution EF · Mentoria 4.0 Tarragonès

Web estàtica per presentar el projecte Dance Revolution EF, jugar a Scratch i consultar els recursos didàctics.

## Estructura

- `index.html`: contingut i navegació accessible.
- `css/styles.css`: disseny adaptable i estètica arcade.
- `js/main.js`: navegació entre pestanyes i interaccions.
- `fotos/`: logos de Mentories 4.0 i del programa educatiu.

No cal un servidor de backend: la web no desa dades ni gestiona comptes, i els jocs i documents s'ofereixen des de Scratch i Google Drive. GitHub Pages publica automàticament la carpeta del repositori mitjançant el workflow de `.github/workflows/pages.yml`. Per provar-la localment amb Python, executa `python -m http.server 8000` des de la carpeta del projecte i obre `http://localhost:8000`.

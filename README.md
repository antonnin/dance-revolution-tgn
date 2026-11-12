# Dance Revolution EF · Mentoria 4.0 Tarragonès

Dance Revolution EF és un projecte educatiu per portar el joc i el moviment de Dance Dance Revolution a les sessions d'Educació Física. Combina una activitat de ball projectada, programació amb Scratch, una pista interactiva amb Makey Makey i recursos per adaptar la proposta a diferents etapes educatives.

El web també permet que els centres comparteixin com ha anat l'activitat. Les aportacions es revisen abans de publicar-se i, un cop validades, alimenten els resultats i el mural de la comunitat.

## Funcionalitats

- **Presentació del projecte:** explica la proposta i la preparació d'una pista conductora perquè el joc respongui a les trepitjades amb punts i so.
- **Joc complet:** incorpora el joc de Scratch (cançons i nivells) i una guia per projectar-lo al gimnàs i preparar la Makey Makey.
- **Plantilla personalitzable:** permet obrir a Scratch una plantilla per crear coreografies i consultar una guia per modificar sons, BPM i seqüències.
- **Recursos didàctics:** inclou infografies per a primària i secundària, propostes vinculades als currículums de primària i ESO, una infografia de sis sessions i un enllaç a la proposta original de Vicenç Rodríguez Jiménez-Bravo.
- **Versió en castellà:** el selector de l'extrem superior permet canviar entre català (per defecte) i castellà sense recarregar la pàgina. Es conserven la secció activa i l'estat dels formularis, i la selecció queda reflectida a l'adreça amb `?lang=es`; també es mostren els materials disponibles en castellà.
- **Comunitat:** ofereix un formulari perquè els centres indiquin l'etapa, valorin la sessió, triïn recomanacions i una cançó i, opcionalment, comparteixin una idea oberta.
- **Resultats i mural:** mostra les respostes validades en estadístiques per etapa, valoració, recomanacions i cançons. Les propostes obertes apareixen al mural amb el nom del centre i la data.
- **Moderació:** l'espai d'administració permet revisar aportacions pendents, validar-les, descartar-les, esborrar-ne de publicades i tancar la sessió.
- **Navegació adaptable:** les seccions tenen adreces pròpies, la navegació es pot fer amb teclat i el disseny s'adapta a pantalles petites.

## Tecnologies i publicació

És un lloc estàtic fet amb HTML, CSS i JavaScript en mòduls ES. No necessita un procés de compilació ni un gestor de paquets. El joc i els materials s'integren des de Scratch i Google Drive; les aportacions i l'accés d'administració utilitzen Cloud Firestore i Firebase Authentication.

El workflow de GitHub Actions de `.github/workflows/pages.yml` publica el contingut del repositori a GitHub Pages quan hi ha canvis a `main` (o quan s'executa manualment). `404.html` recupera les adreces de les seccions i conserva l'idioma quan s'obren o actualitzen directament a GitHub Pages. `dance_revolution_tgn.html` és una pàgina de compatibilitat que redirigeix a `index.html`.

## Estructura del repositori

| Fitxer o carpeta | Contingut |
| --- | --- |
| `index.html` | Les sis seccions del web, el formulari de la comunitat, l'espai d'administració i el peu de pàgina. |
| `css/styles.css` | Estils, disseny adaptable i estètica arcade. |
| `js/main.js` | Navegació, formulari, resultats, mural i moderació. |
| `js/firebase-client.js` | Inicialització del client de Firebase i càrrega dels SDK des de Google. |
| `firestore.rules` | Regles d'accés i validació de les aportacions i dels comptes administradors. |
| `404.html` | Recuperació de les rutes de secció a GitHub Pages. |
| `dance_revolution_tgn.html` | Redirecció per compatibilitat a la pàgina principal. |
| `.github/workflows/pages.yml` | Publicació automàtica a GitHub Pages. |
| `fotos/` | Logotips i imatges del projecte i del programa educatiu. |
| `LICENSE` | Text de la llicència CC0 1.0 Universal inclòs al repositori. |

## Configuració de Firebase

El client està preparat amb la configuració web del projecte Firebase actual. Aquesta configuració s'inclou al navegador i **no és una credencial privada**. Per connectar el web a una altra instància, cal crear un projecte propi i substituir els valors de `firebaseConfig` a `js/firebase-client.js`.

Per habilitar la comunitat i l'administració en un projecte:

1. A Firebase Console, crea una aplicació web i una base de dades Cloud Firestore, i configura els dominis autoritzats de Firebase Authentication perquè incloguin el domini de publicació.
2. Activa el mètode d'inici de sessió **Email/Password**. No cal oferir registre d'usuaris des del web.
3. Crea a Firebase Authentication el compte de cada administrador autoritzat.
4. A Firestore, crea la col·lecció `admins`. Per a cada administrador, crea un document amb el seu UID com a identificador i el camp booleà `enabled` amb valor `true`.
5. Publica a Firestore les regles de `firestore.rules`.
6. A les opcions del repositori, activa GitHub Pages amb GitHub Actions. Després d'un push a `main`, comprova l'estat de la publicació a la pestanya **Actions**.

Les visites poden consultar només les aportacions aprovades i enviar-ne de noves amb estat pendent. L'administració pot consultar totes les aportacions i gestionar-ne l'estat. Les regles de Firestore són imprescindibles: amagar l'espai d'administració a la interfície no el protegiria per si sol.

Les entrades noves inclouen el nom del centre (fins a 120 caràcters), l'etapa, la valoració, almenys una recomanació, la cançó i una resposta oberta opcional (fins a 1.000 caràcters). No s'hi han d'introduir dades personals ni informació que permeti identificar l'alumnat. El nom del centre es mostra al mural quan una aportació amb resposta oberta ha estat validada. Les regles actuals no incorporen un límit de freqüència per als enviaments.

Les aportacions antigues, creades abans de la moderació, poden no tenir estat ni nom de centre. Les regles les tracten com a pendents fins que un administrador les valida; si no tenen nom, en validar-les s'hi assigna «Centre educatiu no indicat».

No publiquis mai contrasenyes, claus privades ni credencials de comptes de servei. La configuració de l'aplicació web de Firebase no les substitueix ni les conté. Consulta els [preus i les quotes actuals de Firebase](https://firebase.google.com/pricing) per comprovar els límits aplicables al projecte.

## Execució local

Des de la carpeta del repositori, inicia un servidor estàtic:

```powershell
python -m http.server 8000
```

Obre <http://localhost:8000>. Per anar directament a una secció localment, es pot afegir, per exemple, `?tab=comunitat` a l'adreça. La navegació, els jocs i els documents integrats es poden consultar sense instal·lar dependències; la càrrega de resultats, l'enviament d'aportacions i l'administració necessiten una configuració accessible de Firebase i les regles publicades.

## Autoria i llicències

**Autoria del projecte i d'aquesta adaptació:** [Anton Nin Nin](https://github.com/antonnin/) i [David Paredes](https://x.com/WARHOLSPORT), mentors 4.0 al CRP Tarragonès, amb suport d'eines d'intel·ligència artificial.

La proposta didàctica original de Dance Revolution EF és de [Vicenç Rodríguez Jiménez-Bravo](https://www.quatreclics.com/inici/autors/vicen%C3%A7-rodr%C3%ADguez-jim%C3%A9nez-bravo). Aquesta adaptació digital s'hi inspira; l'autoria original s'ha d'atribuir separadament.

El fitxer [`LICENSE`](./LICENSE) inclòs en aquest repositori conté la llicència **CC0 1.0 Universal**. El web també mostra al peu un distintiu **CC BY-NC-SA** per a l'obra educativa. Com que són indicacions diferents, no s'ha d'assumir que la llicència del fitxer `LICENSE` s'estén als materials de tercers, a la proposta original o a altres recursos integrats: cal consultar-ne les condicions corresponents abans de reutilitzar-los.

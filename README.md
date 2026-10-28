# Dance Revolution EF · Mentoria 4.0 Tarragonès

Web estàtica per presentar Dance Revolution EF, jugar a Scratch i consultar recursos didàctics. Es publica amb GitHub Pages i desa les experiències de la comunitat a Cloud Firestore.

## Estructura

- `index.html`: contingut, navegació, enquesta, mural i gestió.
- `css/styles.css`: disseny adaptable i estètica arcade.
- `js/main.js`: navegació, enquesta, resultats i administració.
- `js/firebase-client.js`: inicialització del client Firebase amb la configuració web del projecte.
- `firestore.rules`: regles per moderar les aportacions i limitar-ne l'accés als administradors.
- `fotos/`: logos de Mentories 4.0 i del programa educatiu.

## Configurar Firebase

La web utilitza **Cloud Firestore** i **Firebase Authentication**. No cal crear cap servidor ni publicar cap clau privada.

1. A [Firebase Console](https://console.firebase.google.com/), crea un projecte i afegeix una aplicació web.
2. Copia la configuració de l'aplicació web i posa els valors `apiKey`, `authDomain`, `projectId` i `appId` a l'objecte `firebaseConfig` de `js/firebase-client.js`. Aquests valors identifiquen l'aplicació web; no hi posis mai una clau de compte de servei ni una clau privada.
3. A **Build → Firestore Database**, crea una base de dades Cloud Firestore. Tria una ubicació propera als usuaris.
4. A **Build → Authentication → Sign-in method**, activa **Email/Password**.
5. A **Authentication → Settings → Authorized domains**, afegeix el domini on es publica el lloc a GitHub Pages.
6. A **Authentication → Users**, crea el compte que faràs servir per administrar les aportacions. No cal habilitar el registre d'usuaris des de la web.
7. Copia l'UID d'aquest compte. A **Firestore Database → Data**, crea la col·lecció `admins` i un document amb l'UID com a identificador i el camp booleà `enabled` amb valor `true`.
8. A **Firestore Database → Rules**, substitueix les regles per les del fitxer `firestore.rules` i publica-les. Les regles deixen que tothom enviï aportacions pendents, però només mostren les validades. Només un administrador pot llegir les pendents, validar-les o esborrar les validades.
9. Publica el lloc a GitHub Pages. Comprova l'enviament d'una aportació i inicia sessió a **Espai d'administració** amb el correu i la contrasenya del compte administrador de Firebase.

Les aportacions noves queden pendents fins que un administrador les valida. Després de validar-les, apareixen als resultats i al mural públic; el nom del centre només es mostra al costat de les propostes obertes. No hi incloguis dades personals ni informació que permeti identificar l'alumnat. L'administració es protegeix amb Firebase Authentication i les regles de Firestore; una contrasenya escrita al JavaScript públic no seria una protecció segura.

Les aportacions anteriors a la moderació no tenen estat ni nom de centre. Després de publicar les noves regles, apareixeran a l'espai d'administració com a pendents i deixaran de ser públiques fins que un administrador les validi. En validar-les, s'hi assignarà el nom «Centre educatiu no indicat» perquè no es disposa d'aquesta dada.

La configuració web de Firebase forma part del codi del client i no és un secret. No publiquis mai credencials de comptes de servei, claus privades ni contrasenyes. Les regles limiten l'estructura i el contingut de les aportacions, però no inclouen un límit de freqüència per evitar enviaments automatitzats.

El pla Spark de Firebase ofereix quotes gratuïtes, adequades per començar amb un ús petit; no cal activar facturació mentre es mantingui dins dels límits del pla. Consulta els [preus i les quotes actuals](https://firebase.google.com/pricing).

## Provar la pàgina localment

Des de la carpeta del repositori:

```powershell
python -m http.server 8000
```

Obre `http://localhost:8000`. La lectura, l'enviament i la gestió requereixen una configuració vàlida a `js/firebase-client.js` i les regles de Firestore publicades.

GitHub Pages publica automàticament la carpeta del repositori amb `.github/workflows/pages.yml`.

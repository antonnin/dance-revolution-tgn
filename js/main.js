import {
    addDoc,
    auth,
    collection,
    db,
    deleteDoc,
    doc,
    firebaseConfigured,
    firebaseInitializationError,
    getDoc,
    onAuthStateChanged,
    onSnapshot,
    query,
    serverTimestamp,
    signInWithEmailAndPassword,
    signOut,
    updateDoc,
    where,
} from './firebase-client.js';

const tabButtons = [...document.querySelectorAll('[role="tab"]')];
const tabPanels = [...document.querySelectorAll('.tab-panel')];
const stages = ['Infantil', 'Primària', 'ESO', 'Altres'];
const outcomes = ['Molt bé', 'Bé', 'Regular', 'Ens ha costat'];
const recommendationOptions = [
    'Fer una prova tècnica abans de començar',
    'Començar amb una cançó o nivell fàcil',
    'Projectar la pantalla ben gran i visible',
    'Organitzar torns i grups petits',
    'Adaptar els passos a les necessitats del grup',
    'Fer una demostració abans de jugar',
];
const songs = [
    'Shut Up and Dance',
    'Happy',
    'Only Human',
    "Don't Start Now",
    "CAN'T STOP THE FEELING!",
    'Blinding Lights',
    'My Way',
    'Sucker',
];

let communityResponses = [];
let adminResponses = [];
let adminUser = null;
let stopCommunityListener = null;
let stopAdminListener = null;

function openTab(tabId, updateHistory = true) {
    const loginDialog = document.querySelector('#admin-login-dialog');
    if (tabId !== 'gestio' && loginDialog.open) loginDialog.close();
    const activeButton = tabButtons.find((button) => button.getAttribute('aria-controls') === tabId);
    const activePanel = document.getElementById(tabId);

    if (!activeButton || !activePanel) {
        console.error(`No s'ha trobat la pestanya "${tabId}".`);
        return;
    }

    tabButtons.forEach((button) => {
        const isActive = button === activeButton;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-selected', String(isActive));
        button.tabIndex = isActive ? 0 : -1;
    });

    tabPanels.forEach((panel) => {
        const isActive = panel === activePanel;
        panel.classList.toggle('is-active', isActive);
        panel.hidden = !isActive;
    });

    if (updateHistory && window.location.hash !== `#${tabId}`) {
        window.history.replaceState(null, '', `#${tabId}`);
    }

    if (tabId === 'comunitat') loadCommunity();
    if (tabId === 'gestio') {
        updateAdminVisibility();
        if (adminUser) loadAdminResponses();
    }
}

tabButtons.forEach((button, index) => {
    button.addEventListener('click', () => openTab(button.getAttribute('aria-controls')));
    button.addEventListener('keydown', (event) => {
        let nextIndex;
        if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabButtons.length;
        else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabButtons.length) % tabButtons.length;
        else if (event.key === 'Home') nextIndex = 0;
        else if (event.key === 'End') nextIndex = tabButtons.length - 1;
        else return;

        event.preventDefault();
        tabButtons[nextIndex].focus();
        openTab(tabButtons[nextIndex].getAttribute('aria-controls'));
    });
});

document.querySelectorAll('[data-open-tab]').forEach((button) => {
    button.addEventListener('click', () => {
        const tabId = button.getAttribute('data-open-tab');
        openTab(tabId);
        document.getElementById(`nav-${tabId}`).focus();
    });
});

function validResponse(response) {
    return response
        && typeof response.id === 'string'
        && /^[\w-]{1,60}$/.test(response.id)
        && (response.centerName === undefined
            || (typeof response.centerName === 'string'
                && response.centerName.trim().length > 0
                && response.centerName.length <= 120))
        && stages.includes(response.stage)
        && outcomes.includes(response.outcome)
        && Array.isArray(response.recommendations)
        && response.recommendations.length > 0
        && response.recommendations.length <= recommendationOptions.length
        && response.recommendations.every((item) => recommendationOptions.includes(item))
        && new Set(response.recommendations).size === response.recommendations.length
        && songs.includes(response.song)
        && typeof response.openAnswer === 'string'
        && response.openAnswer.length <= 1000
        && (response.status === undefined || ['pending', 'approved'].includes(response.status))
        && typeof response.createdAt === 'string'
        && !Number.isNaN(Date.parse(response.createdAt));
}

function responseFromDocument(document) {
    const data = document.data({ serverTimestamps: 'estimate' });
    const createdAt = typeof data.createdAt?.toDate === 'function'
        ? data.createdAt.toDate().toISOString()
        : '';
    return { id: document.id, ...data, createdAt };
}

function ensureFirebaseConfigured() {
    if (!firebaseConfigured) {
        throw new Error('Firebase encara no està configurat. Consulta les instruccions del README.');
    }
    if (!db || !auth) {
        throw new Error(`No s'ha pogut inicialitzar Firebase: ${firebaseInitializationError || 'revisa la configuració web del projecte.'}`);
    }
}

function appendCountGroup(parent, title, counts, total) {
    const section = document.createElement('section');
    section.className = 'stat-group';
    const heading = document.createElement('h3');
    heading.textContent = title;
    section.append(heading);

    const list = document.createElement('ul');
    list.className = 'stat-list';
    const entries = Object.entries(counts).sort((left, right) => right[1] - left[1]);
    for (const [label, count] of entries) {
        const item = document.createElement('li');
        item.className = 'stat-item';
        const row = document.createElement('div');
        row.className = 'stat-label';
        const name = document.createElement('span');
        name.textContent = label;
        const value = document.createElement('strong');
        value.textContent = String(count);
        row.append(name, value);

        const track = document.createElement('span');
        track.className = 'stat-track';
        const bar = document.createElement('span');
        bar.className = 'stat-bar';
        bar.style.width = `${Math.min(100, (count / total) * 100)}%`;
        track.append(bar);
        item.append(row, track);
        list.append(item);
    }
    section.append(list);
    parent.append(section);
}

function renderCommunity(responses) {
    const statsContainer = document.querySelector('#community-stats');
    const wall = document.querySelector('#community-wall');
    const status = document.querySelector('#community-results-status');
    const stats = { stages: {}, outcomes: {}, recommendations: {}, songs: {} };

    statsContainer.replaceChildren();
    wall.replaceChildren();
    status.textContent = `${responses.length} experiències validades i publicades per la comunitat.`;

    for (const response of responses) {
        stats.stages[response.stage] = (stats.stages[response.stage] || 0) + 1;
        stats.outcomes[response.outcome] = (stats.outcomes[response.outcome] || 0) + 1;
        stats.songs[response.song] = (stats.songs[response.song] || 0) + 1;
        for (const recommendation of response.recommendations) {
            stats.recommendations[recommendation] = (stats.recommendations[recommendation] || 0) + 1;
        }
    }

    if (responses.length) {
        appendCountGroup(statsContainer, 'Com ha anat?', stats.outcomes, responses.length);
        appendCountGroup(statsContainer, 'Recomanacions', stats.recommendations, responses.length);
        appendCountGroup(statsContainer, 'Cançons preferides', stats.songs, responses.length);
        appendCountGroup(statsContainer, 'Etapes educatives', stats.stages, responses.length);
    } else {
        const empty = document.createElement('p');
        empty.className = 'empty-community';
        empty.textContent = 'Encara no hi ha respostes. Sigues el primer centre a compartir la seva experiència.';
        statsContainer.append(empty);
    }

    const openResponses = responses.filter((response) => response.openAnswer.trim());
    if (!openResponses.length) {
        const empty = document.createElement('p');
        empty.className = 'empty-community';
        empty.textContent = 'Les propostes obertes apareixeran aquí quan les comparteixin els centres.';
        wall.append(empty);
        return;
    }

    for (const response of openResponses) {
        const card = document.createElement('article');
        card.className = 'wall-card';
        const metadata = document.createElement('p');
        metadata.className = 'wall-meta';
        metadata.textContent = `${response.centerName || 'Centre educatiu no indicat'} · ${new Intl.DateTimeFormat('ca').format(new Date(response.createdAt))}`;
        const answer = document.createElement('p');
        answer.className = 'wall-answer';
        answer.textContent = response.openAnswer;
        card.append(metadata, answer);
        wall.append(card);
    }
}

async function loadCommunity() {
    const status = document.querySelector('#community-results-status');
    try {
        ensureFirebaseConfigured();
        if (stopCommunityListener) return;

        status.textContent = 'Carregant les respostes...';
        const responsesQuery = query(
            collection(db, 'communityResponses'),
            where('status', '==', 'approved'),
        );
        stopCommunityListener = onSnapshot(responsesQuery, (snapshot) => {
            try {
                const responses = snapshot.docs.map(responseFromDocument);
                if (responses.some((response) => !validResponse(response))) {
                    throw new Error('La base de dades conté una aportació amb dades no vàlides.');
                }
                responses.sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
                communityResponses = responses;
                renderCommunity(communityResponses);
                if (adminUser) {
                    document.querySelector('#admin-status').textContent =
                        `${adminResponses.filter((response) => response.status === 'pending' || !response.status).length} pendents de validar · ${adminResponses.filter((response) => response.status === 'approved').length} validades.`;
                }
            } catch (error) {
                status.textContent = `No s'han pogut mostrar els resultats: ${error.message}`;
            }
        }, (error) => {
            stopCommunityListener = null;
            status.textContent = `No s'han pogut carregar els resultats de Firebase: ${error.message}`;
            if (adminUser) {
                document.querySelector('#admin-status').textContent =
                    `No s'han pogut carregar les aportacions: ${error.message}`;
            }
        });
    } catch (error) {
        status.textContent = `No s'han pogut carregar els resultats: ${error.message}`;
    }
}

function updateAdminVisibility() {
    const unlocked = Boolean(adminUser);
    document.querySelector('#admin-workspace').hidden = !unlocked;
    if (!unlocked) {
        adminResponses = [];
        document.querySelector('#admin-pending').replaceChildren();
        document.querySelector('#admin-approved').replaceChildren();
        if (stopAdminListener) {
            stopAdminListener();
            stopAdminListener = null;
        }
    }
    const loginDialog = document.querySelector('#admin-login-dialog');
    const adminTabActive = document.querySelector('#gestio').classList.contains('is-active');
    if (unlocked && loginDialog.open) loginDialog.close();
    if (!unlocked && adminTabActive && !loginDialog.open) loginDialog.showModal();
}

function renderAdminResponses() {
    const pendingContainer = document.querySelector('#admin-pending');
    const approvedContainer = document.querySelector('#admin-approved');
    pendingContainer.replaceChildren();
    approvedContainer.replaceChildren();
    const pendingResponses = adminResponses.filter((response) => response.status !== 'approved');
    const approvedResponses = adminResponses.filter((response) => response.status === 'approved');
    for (const [container, responses, emptyMessage] of [
        [pendingContainer, pendingResponses, 'No hi ha aportacions pendents de validar.'],
        [approvedContainer, approvedResponses, 'Encara no hi ha aportacions validades.'],
    ]) {
        if (!responses.length) {
            const empty = document.createElement('p');
            empty.className = 'empty-community';
            empty.textContent = emptyMessage;
            container.append(empty);
        }
        responses.forEach((response) => {
            const card = document.createElement('article');
            card.className = `admin-response-card${response.status === 'approved' ? '' : ' is-pending'}`;
            const heading = document.createElement('h3');
            heading.textContent = `${response.centerName || 'Centre educatiu no indicat'} · ${response.stage} · ${new Intl.DateTimeFormat('ca').format(new Date(response.createdAt))}`;
            const details = document.createElement('p');
            details.className = 'admin-response-summary';
            details.textContent = `${response.outcome} · ${response.song} · ${response.recommendations.join(', ')}`;
            const answer = document.createElement('p');
            answer.className = 'admin-response-answer';
            answer.textContent = response.openAnswer || 'Sense resposta oberta.';
            const actions = document.createElement('div');
            actions.className = 'admin-response-actions';
            if (response.status !== 'approved') {
                const approve = document.createElement('button');
                approve.className = 'button button-outline admin-approve';
                approve.type = 'button';
                approve.textContent = 'Valida i publica';
                approve.addEventListener('click', () => approveContribution(response, approve));
                actions.append(approve);
                const discard = document.createElement('button');
                discard.className = 'button button-outline admin-discard';
                discard.type = 'button';
                discard.textContent = 'Descarta comentari';
                discard.addEventListener('click', () => deleteContribution(response, discard, true));
                actions.append(discard);
            } else {
                const remove = document.createElement('button');
                remove.className = 'button button-outline admin-delete';
                remove.type = 'button';
                remove.textContent = 'Esborra aquesta aportació';
                remove.addEventListener('click', () => deleteContribution(response, remove));
                actions.append(remove);
            }
            card.append(heading, details, answer, actions);
            container.append(card);
        });
    }
}

async function loadAdminResponses() {
    const status = document.querySelector('#admin-status');
    status.textContent = 'Carregant les aportacions de Firebase...';
    try {
        ensureFirebaseConfigured();
        if (stopAdminListener) return;
        stopAdminListener = onSnapshot(collection(db, 'communityResponses'), (snapshot) => {
            try {
                adminResponses = snapshot.docs.map(responseFromDocument);
                if (adminResponses.some((response) => !validResponse(response))) {
                    throw new Error('La base de dades conté una aportació amb dades no vàlides.');
                }
                adminResponses.sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
                const pendingCount = adminResponses.filter((response) => response.status !== 'approved').length;
                const approvedCount = adminResponses.length - pendingCount;
                status.textContent = `${pendingCount} pendents de validar · ${approvedCount} validades.`;
                renderAdminResponses();
            } catch (error) {
                status.textContent = `No s'han pogut mostrar les aportacions: ${error.message}`;
            }
        }, (error) => {
            stopAdminListener = null;
            status.textContent = `No s'han pogut carregar les aportacions: ${error.message}`;
        });
    } catch (error) {
        status.textContent = `No s'han pogut carregar les aportacions: ${error.message}`;
    }
}

async function approveContribution(response, button) {
    const status = document.querySelector('#admin-status');
    button.disabled = true;
    status.textContent = 'Validant l’aportació...';
    try {
        ensureFirebaseConfigured();
        if (!adminUser) throw new Error('Cal iniciar sessió amb un compte administrador.');
        await updateDoc(doc(db, 'communityResponses', response.id), {
            status: 'approved',
            approvedAt: serverTimestamp(),
            ...(!response.centerName ? { centerName: 'Centre educatiu no indicat' } : {}),
        });
        status.textContent = 'Aportació validada i publicada.';
    } catch (error) {
        status.textContent = `No s'ha pogut validar l'aportació: ${error.message}`;
        button.disabled = false;
    }
}

async function deleteContribution(response, button, isPending = false) {
    const confirmation = isPending
        ? 'Vols descartar definitivament aquesta aportació pendent? No es publicarà al mural ni a les estadístiques.'
        : 'Vols esborrar definitivament aquesta aportació publicada de Firebase?';
    if (!window.confirm(confirmation)) return;
    const status = document.querySelector('#admin-status');
    button.disabled = true;
    status.textContent = isPending ? 'Descartant l’aportació pendent...' : 'Esborrant l’aportació publicada...';

    try {
        ensureFirebaseConfigured();
        if (!adminUser) throw new Error('Cal iniciar sessió amb un compte administrador.');
        await deleteDoc(doc(db, 'communityResponses', response.id));
        communityResponses = communityResponses.filter((item) => item.id !== response.id);
        adminResponses = adminResponses.filter((item) => item.id !== response.id);
        status.textContent = isPending
            ? 'Aportació pendent descartada; no s’ha publicat.'
            : 'Aportació publicada esborrada de Firebase.';
        renderCommunity(communityResponses);
        renderAdminResponses();
    } catch (error) {
        status.textContent = `No s'ha pogut esborrar l'aportació: ${error.message}`;
        button.disabled = false;
    }
}

const experienceForm = document.querySelector('#experience-form');
experienceForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const feedback = document.querySelector('#experience-feedback');
    if (!experienceForm.checkValidity()) {
        experienceForm.reportValidity();
        return;
    }

    const formData = new FormData(experienceForm);
    const selectedRecommendations = formData.getAll('recommendations').map(String);
    if (!selectedRecommendations.length) {
        feedback.textContent = 'Tria almenys una recomanació abans de publicar l’experiència.';
        return;
    }
    const response = {
        centerName: String(formData.get('centerName') || '').trim(),
        stage: String(formData.get('stage')),
        outcome: String(formData.get('outcome')),
        recommendations: selectedRecommendations,
        song: String(formData.get('song')),
        openAnswer: String(formData.get('story') || '').trim(),
    };
    if (!response.centerName
        || response.centerName.length > 120
        || !stages.includes(response.stage)
        || !outcomes.includes(response.outcome)
        || !songs.includes(response.song)
        || !response.recommendations.length
        || response.recommendations.some((item) => !recommendationOptions.includes(item))
        || response.openAnswer.length > 1000) {
        feedback.textContent = 'Les respostes no són vàlides. Revisa el formulari i torna-ho a provar.';
        return;
    }

    const submitButton = experienceForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    feedback.textContent = 'Enviant la resposta per validar...';
    try {
        ensureFirebaseConfigured();
        await addDoc(collection(db, 'communityResponses'), {
            ...response,
            status: 'pending',
            createdAt: serverTimestamp(),
        });
        experienceForm.reset();
        document.querySelector('#experience-stage').value = 'Primària';
        feedback.textContent = 'Gràcies! L’equip revisarà la teva resposta abans de publicar-la.';
    } catch (error) {
        feedback.textContent = `No s’ha pogut publicar l’experiència: ${error.message}`;
    } finally {
        submitButton.disabled = false;
    }
});

document.querySelector('#admin-login-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '');
    const status = document.querySelector('#admin-login-status');
    status.textContent = 'Iniciant sessió a Firebase...';
    form.reset();
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
        ensureFirebaseConfigured();
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        status.textContent = `No s’ha pogut iniciar la sessió: ${error.message}`;
    } finally {
        button.disabled = false;
    }
});

document.querySelector('#admin-login-dialog')?.addEventListener('cancel', (event) => {
    event.preventDefault();
});

document.querySelector('#admin-lock')?.addEventListener('click', async () => {
    try {
        await signOut(auth);
        document.querySelector('#admin-login-status').textContent = 'Sessió tancada.';
    } catch (error) {
        document.querySelector('#admin-status').textContent =
            `No s'ha pogut tancar la sessió: ${error.message}`;
    }
});

if (auth) {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            adminUser = null;
            updateAdminVisibility();
            return;
        }

        const status = document.querySelector('#admin-login-status');
        status.textContent = 'Comprovant els permisos d’administració...';
        try {
            const adminDocument = await getDoc(doc(db, 'admins', user.uid));
            if (!adminDocument.exists() || adminDocument.data().enabled !== true) {
                adminUser = null;
                updateAdminVisibility();
                await signOut(auth);
                status.textContent = 'Aquest compte no té permisos per gestionar les aportacions.';
                return;
            }

            adminUser = user;
            updateAdminVisibility();
            await loadAdminResponses();
        } catch (error) {
            adminUser = null;
            updateAdminVisibility();
            status.textContent = `No s'han pogut comprovar els permisos: ${error.message}`;
        }
    }, (error) => {
        document.querySelector('#admin-login-status').textContent =
            `No s'ha pogut comprovar la sessió de Firebase: ${error.message}`;
    });
} else {
    document.querySelector('#admin-login-status').textContent =
        firebaseConfigured
            ? `No s'ha pogut inicialitzar Firebase: ${firebaseInitializationError || 'revisa la configuració web del projecte.'}`
            : 'Configura Firebase per habilitar l’accés d’administració.';
}

const requestedTab = window.location.hash.slice(1);
const initialTab = tabPanels.some((panel) => panel.id === requestedTab) ? requestedTab : 'motivacio';
updateAdminVisibility();
openTab(initialTab, false);

const tabButtons = [...document.querySelectorAll('[role="tab"]')];
const tabPanels = [...document.querySelectorAll('.tab-panel')];
const adminVerifierKey = 'dance-revolution-admin-verifier';
const adminSessionKey = 'dance-revolution-admin-unlocked';
let communityResponses = [];
let communityDataLoaded = false;
let communityDataDirty = false;
let communityFileHandle = null;

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

function openTab(tabId, updateHistory = true) {
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
    if (tabId === 'gestio') loadAdminWorkspace();
}

tabButtons.forEach((button, index) => {
    button.addEventListener('click', () => openTab(button.getAttribute('aria-controls')));
    button.addEventListener('keydown', (event) => {
        let nextIndex;

        if (event.key === 'ArrowRight') {
            nextIndex = (index + 1) % tabButtons.length;
        } else if (event.key === 'ArrowLeft') {
            nextIndex = (index - 1 + tabButtons.length) % tabButtons.length;
        } else if (event.key === 'Home') {
            nextIndex = 0;
        } else if (event.key === 'End') {
            nextIndex = tabButtons.length - 1;
        } else {
            return;
        }

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

function appendCountGroup(parent, title, counts, total) {
    const section = document.createElement('section');
    section.className = 'stat-group';
    const heading = document.createElement('h3');
    heading.textContent = title;
    section.append(heading);

    const list = document.createElement('ul');
    list.className = 'stat-list';
    const entries = Object.entries(counts).sort((left, right) => right[1] - left[1]);
    if (!entries.length) {
        const empty = document.createElement('li');
        empty.textContent = 'Encara no hi ha respostes publicades.';
        list.append(empty);
    }

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
        bar.style.width = `${total ? Math.min(100, (count / total) * 100) : 0}%`;
        track.append(bar);
        item.append(row, track);
        list.append(item);
    }

    section.append(list);
    parent.append(section);
}

function renderCommunity(data) {
    if (!data || !Array.isArray(data.responses)) {
        throw new Error('El fitxer de respostes no té el format esperat.');
    }

    const statsContainer = document.querySelector('#community-stats');
    const wall = document.querySelector('#community-wall');
    const status = document.querySelector('#community-results-status');
    const published = data.responses.filter(isValidPublicResponse);
    const stats = {
        stages: {},
        outcomes: {},
        recommendations: {},
        songs: {},
    };

    statsContainer.replaceChildren();
    wall.replaceChildren();
    status.textContent = `${published.length} experiències publicades. Les respostes han estat revisades per l'equip.`;

    for (const response of published) {
        stats.stages[response.stage] = (stats.stages[response.stage] || 0) + 1;
        stats.outcomes[response.outcome] = (stats.outcomes[response.outcome] || 0) + 1;
        stats.songs[response.song] = (stats.songs[response.song] || 0) + 1;
        for (const recommendation of response.recommendations) {
            stats.recommendations[recommendation] = (stats.recommendations[recommendation] || 0) + 1;
        }
    }

    if (published.length) {
        appendCountGroup(statsContainer, 'Com ha anat?', stats.outcomes, published.length);
        appendCountGroup(statsContainer, 'Recomanacions', stats.recommendations, published.length);
        appendCountGroup(statsContainer, 'Cançons preferides', stats.songs, published.length);
        appendCountGroup(statsContainer, 'Etapes educatives', stats.stages, published.length);
    } else {
        const empty = document.createElement('p');
        empty.className = 'empty-community';
        empty.textContent = 'Quan afegim les primeres experiències revisades, aquí apareixeran els resultats agregats.';
        statsContainer.append(empty);
    }

    const openResponses = published.filter((response) => response.openAnswer);
    if (!openResponses.length) {
        const empty = document.createElement('p');
        empty.className = 'empty-community';
        empty.textContent = 'Encara no hi ha propostes obertes publicades. Les respostes apareixeran aquí després de la revisió.';
        wall.append(empty);
        return;
    }

    for (const response of openResponses) {
        const card = document.createElement('article');
        card.className = 'wall-card';
        const metadata = document.createElement('p');
        metadata.className = 'wall-meta';
        const date = new Date(response.createdAt);
        metadata.textContent = `${response.stage} · ${Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('ca').format(date)}`;
        const answer = document.createElement('p');
        answer.className = 'wall-answer';
        answer.textContent = response.openAnswer;
        card.append(metadata, answer);
        wall.append(card);
    }
}

function isValidPublicResponse(response) {
    return response
        && typeof response.id === 'string'
        && response.id.length <= 60
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
        && typeof response.createdAt === 'string'
        && !Number.isNaN(Date.parse(response.createdAt));
}

async function loadCommunity() {
    const status = document.querySelector('#community-results-status');
    if (communityDataDirty) {
        renderCommunity({ responses: communityResponses });
        return true;
    }

    try {
        status.textContent = 'Carregant les respostes...';
        const response = await fetch('community-responses.json', { cache: 'no-store' });
        if (!response.ok) throw new Error(`No s'ha pogut llegir el fitxer de resultats (${response.status}).`);
        const data = await response.json();
        if (!data || !Array.isArray(data.responses) || data.responses.some((item) => !isValidPublicResponse(item))) {
            throw new Error('El fitxer de respostes conté dades no vàlides.');
        }
        communityResponses = data.responses;
        communityDataLoaded = true;
        renderCommunity(data);
        return true;
    } catch (error) {
        status.textContent = `No s'han pogut carregar els resultats: ${error.message}`;
        return false;
    }
}

function bytesToHex(bytes) {
    return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function passwordHash(password, salt) {
    if (!crypto.subtle) throw new Error('La gestió requereix obrir la web amb HTTPS o localhost.');
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveBits'],
    );
    const derived = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' },
        key,
        256,
    );
    return bytesToHex(derived);
}

async function createAdminVerifier(password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const verifier = await passwordHash(password, salt);
    localStorage.setItem(adminVerifierKey, JSON.stringify({
        salt: bytesToHex(salt),
        verifier,
    }));
}

async function isAdminPasswordValid(password) {
    const config = JSON.parse(localStorage.getItem(adminVerifierKey));
    const salt = Uint8Array.from(config.salt.match(/.{2}/g), (byte) => Number.parseInt(byte, 16));
    return await passwordHash(password, salt) === config.verifier;
}

function updateAdminVisibility() {
    const hasPassword = Boolean(localStorage.getItem(adminVerifierKey));
    const unlocked = sessionStorage.getItem(adminSessionKey) === 'true';
    document.querySelector('#admin-setup-form').hidden = hasPassword;
    document.querySelector('#admin-login-form').hidden = !hasPassword || unlocked;
    document.querySelector('#admin-workspace').hidden = !unlocked;
    if (!unlocked) document.querySelector('#admin-responses').replaceChildren();
}

function appendAdminSelect(parent, labelText, name, options, selected) {
    const label = document.createElement('label');
    label.className = 'admin-field';
    const caption = document.createElement('span');
    caption.textContent = labelText;
    const select = document.createElement('select');
    select.name = name;
    select.required = true;
    for (const value of options) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        option.selected = value === selected;
        select.append(option);
    }
    label.append(caption, select);
    parent.append(label);
}

function renderAdminResponses() {
    const container = document.querySelector('#admin-responses');
    container.replaceChildren();

    if (!communityResponses.length) {
        const empty = document.createElement('p');
        empty.className = 'empty-community';
        empty.textContent = 'El fitxer encara no conté respostes.';
        container.append(empty);
        return;
    }

    communityResponses.forEach((response, index) => {
        const card = document.createElement('article');
        card.className = 'admin-response-card';
        const heading = document.createElement('h3');
        heading.textContent = `Resposta ${index + 1} · ${response.stage} · ${new Intl.DateTimeFormat('ca').format(new Date(response.createdAt))}`;
        const form = document.createElement('form');
        form.className = 'admin-response-form';
        appendAdminSelect(form, 'Etapa', 'stage', stages, response.stage);
        appendAdminSelect(form, 'Com ha anat?', 'outcome', outcomes, response.outcome);
        appendAdminSelect(form, 'Cançó preferida', 'song', songs, response.song);

        const fieldset = document.createElement('fieldset');
        fieldset.className = 'admin-recommendations';
        const legend = document.createElement('legend');
        legend.textContent = 'Recomanacions';
        fieldset.append(legend);
        for (const recommendation of recommendationOptions) {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'recommendations';
            checkbox.value = recommendation;
            checkbox.checked = response.recommendations.includes(recommendation);
            const text = document.createElement('span');
            text.textContent = recommendation;
            label.append(checkbox, text);
            fieldset.append(label);
        }
        form.append(fieldset);

        const answerLabel = document.createElement('label');
        answerLabel.className = 'admin-field admin-answer-field';
        const answerCaption = document.createElement('span');
        answerCaption.textContent = 'Què canviaríeu o afegiríeu?';
        const answer = document.createElement('textarea');
        answer.name = 'openAnswer';
        answer.maxLength = 1000;
        answer.rows = 3;
        answer.value = response.openAnswer;
        answerLabel.append(answerCaption, answer);
        form.append(answerLabel);

        const actions = document.createElement('div');
        actions.className = 'admin-response-actions';
        const save = document.createElement('button');
        save.className = 'button button-outline';
        save.type = 'submit';
        save.textContent = 'Desa els canvis';
        const remove = document.createElement('button');
        remove.className = 'button button-outline admin-delete';
        remove.type = 'button';
        remove.textContent = 'Esborra la resposta';
        actions.append(save, remove);
        form.append(actions);
        card.append(heading, form);
        container.append(card);

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const formData = new FormData(form);
            const updated = {
                ...response,
                stage: String(formData.get('stage')),
                outcome: String(formData.get('outcome')),
                recommendations: formData.getAll('recommendations').map(String),
                song: String(formData.get('song')),
                openAnswer: String(formData.get('openAnswer')).trim(),
            };
            if (!isValidPublicResponse(updated)) {
                document.querySelector('#admin-feedback').textContent = 'Tria almenys una recomanació i comprova les dades.';
                return;
            }
            communityResponses[index] = updated;
            communityDataDirty = true;
            document.querySelector('#admin-feedback').textContent = 'Canvis aplicats al fitxer en memòria. Prem «Desa el fitxer JSON» per escriure’ls al fitxer seleccionat.';
            document.querySelector('#admin-status').textContent = 'Hi ha canvis sense desar al fitxer JSON.';
            renderCommunity({ responses: communityResponses });
            renderAdminResponses();
        });

        remove.addEventListener('click', () => {
            if (!window.confirm('Vols esborrar aquesta resposta del fitxer de treball?')) return;
            communityResponses.splice(index, 1);
            communityDataDirty = true;
            document.querySelector('#admin-feedback').textContent = 'Resposta eliminada en memòria. Prem «Desa el fitxer JSON» per aplicar el canvi al fitxer seleccionat.';
            document.querySelector('#admin-status').textContent = 'Hi ha canvis sense desar al fitxer JSON.';
            renderCommunity({ responses: communityResponses });
            renderAdminResponses();
        });
    });
}

async function loadAdminWorkspace() {
    updateAdminVisibility();
    if (sessionStorage.getItem(adminSessionKey) !== 'true') return;

    const status = document.querySelector('#admin-status');
    status.textContent = 'Carregant el fitxer públic de respostes...';
    if (!communityDataLoaded && !communityDataDirty) {
        const loaded = await loadCommunity();
        if (!loaded) {
            status.textContent = 'No s’ha pogut llegir el fitxer públic. Obre la pàgina amb HTTPS o mitjançant un servidor local.';
            return;
        }
    }
    status.textContent = communityDataDirty
        ? 'Hi ha canvis sense desar al fitxer JSON.'
        : `${communityResponses.length} respostes carregades. Obre el fitxer que vulguis gestionar.`;
    renderAdminResponses();
}

async function loadCommunityFile(file) {
    const status = document.querySelector('#admin-status');
    let data;
    try {
        data = JSON.parse(await file.text());
    } catch {
        throw new Error('El fitxer seleccionat no conté JSON vàlid.');
    }

    if (!data || !Array.isArray(data.responses) || data.responses.some((item) => !isValidPublicResponse(item))) {
        throw new Error('El JSON ha de contenir una llista de respostes amb dades vàlides.');
    }

    communityResponses = data.responses;
    communityDataLoaded = true;
    communityDataDirty = false;
    communityFileHandle = null;
    status.textContent = `${communityResponses.length} respostes carregades des de ${file.name}.`;
    renderAdminResponses();
    renderCommunity({ responses: communityResponses });
}

document.querySelector('#admin-open-file')?.addEventListener('click', async () => {
    const status = document.querySelector('#admin-status');
    try {
        if (typeof window.showOpenFilePicker === 'function') {
            const [handle] = await window.showOpenFilePicker({
                multiple: false,
                types: [{
                    description: 'Fitxer JSON de respostes',
                    accept: { 'application/json': ['.json'] },
                }],
            });
            const file = await handle.getFile();
            await loadCommunityFile(file);
            communityFileHandle = handle;
            return;
        }
        document.querySelector('#admin-file-input').click();
    } catch (error) {
        if (error.name !== 'AbortError') status.textContent = `No s'ha pogut obrir el fitxer: ${error.message}`;
    }
});

document.querySelector('#admin-file-input')?.addEventListener('change', async (event) => {
    const [file] = event.currentTarget.files;
    if (!file) return;
    try {
        await loadCommunityFile(file);
        document.querySelector('#admin-status').textContent += ' Aquest navegador no permet desar directament: descarregarà una còpia JSON.';
    } catch (error) {
        document.querySelector('#admin-status').textContent = `No s'ha pogut obrir el fitxer: ${error.message}`;
    }
    event.currentTarget.value = '';
});

document.querySelector('#admin-setup-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const feedback = document.querySelector('#admin-feedback');
    const formData = new FormData(form);
    const password = String(formData.get('password'));
    if (!password || password !== String(formData.get('confirmation'))) {
        feedback.textContent = 'Les contrasenyes no coincideixen.';
        return;
    }

    try {
        await createAdminVerifier(password);
        sessionStorage.setItem(adminSessionKey, 'true');
        updateAdminVisibility();
        form.reset();
        feedback.textContent = 'Contrasenya local configurada. Aquest bloqueig no protegeix el fitxer públic.';
        await loadAdminWorkspace();
    } catch (error) {
        feedback.textContent = `No s’ha pogut configurar la contrasenya: ${error.message}`;
    }
});

document.querySelector('#admin-login-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const feedback = document.querySelector('#admin-feedback');
    const password = String(new FormData(form).get('password'));
    try {
        if (!await isAdminPasswordValid(password)) {
            feedback.textContent = 'La contrasenya no és correcta.';
            return;
        }
        sessionStorage.setItem(adminSessionKey, 'true');
        updateAdminVisibility();
        form.reset();
        feedback.textContent = 'Gestió desbloquejada en aquest navegador.';
        await loadAdminWorkspace();
    } catch (error) {
        feedback.textContent = `No s’ha pogut verificar la contrasenya: ${error.message}`;
    }
});

document.querySelector('#admin-lock')?.addEventListener('click', () => {
    sessionStorage.removeItem(adminSessionKey);
    updateAdminVisibility();
    document.querySelector('#admin-feedback').textContent = 'Gestió tancada.';
});

document.querySelector('#admin-save-file')?.addEventListener('click', async () => {
    const data = JSON.stringify({ responses: communityResponses }, null, 2);
    const status = document.querySelector('#admin-status');

    try {
        if (typeof window.showSaveFilePicker === 'function') {
            const handle = communityFileHandle || await window.showSaveFilePicker({
                suggestedName: 'community-responses.json',
                types: [{
                    description: 'Fitxer JSON de respostes',
                    accept: { 'application/json': ['.json'] },
                }],
            });
            const permission = await handle.queryPermission({ mode: 'readwrite' });
            if (permission !== 'granted' && await handle.requestPermission({ mode: 'readwrite' }) !== 'granted') {
                throw new Error('No s’ha concedit permís per desar el fitxer.');
            }

            const writable = await handle.createWritable();
            await writable.write(`${data}\n`);
            await writable.close();
            communityFileHandle = handle;
            communityDataDirty = false;
            status.textContent = 'Canvis desats al fitxer JSON seleccionat. Si era al repositori local, fes commit i push per publicar-los.';
            return;
        }

        const blob = new Blob([`${data}\n`], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'community-responses.json';
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        status.textContent = 'Còpia JSON descarregada. Substitueix el fitxer del repositori i fes commit i push per publicar els canvis.';
    } catch (error) {
        if (error.name !== 'AbortError') status.textContent = `No s'han pogut desar els canvis: ${error.message}`;
    }
});

document.querySelector('#admin-add-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const feedback = document.querySelector('#admin-feedback');
    const formData = new FormData(form);
    const response = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        stage: String(formData.get('stage')),
        outcome: String(formData.get('outcome')),
        recommendations: formData.getAll('recommendations').map(String),
        song: String(formData.get('song')),
        openAnswer: String(formData.get('openAnswer')).trim(),
    };

    if (!isValidPublicResponse(response)) {
        feedback.textContent = 'Tria almenys una recomanació abans d’afegir la resposta.';
        return;
    }
    communityResponses.push(response);
    communityDataDirty = true;
    form.reset();
    document.querySelector('#admin-stage').value = 'Primària';
    feedback.textContent = 'Resposta afegida en memòria. Prem «Desa el fitxer JSON» per escriure-la al fitxer seleccionat.';
    document.querySelector('#admin-status').textContent = `${communityResponses.length} respostes; hi ha canvis sense desar al fitxer JSON.`;
    renderCommunity({ responses: communityResponses });
    renderAdminResponses();
});

const experienceForm = document.querySelector('#experience-form');
experienceForm?.addEventListener('submit', (event) => {
    event.preventDefault();

    const feedback = document.querySelector('#experience-feedback');
    if (!experienceForm.checkValidity()) {
        experienceForm.reportValidity();
        return;
    }

    const formData = new FormData(experienceForm);
    const selectedRecommendations = formData.getAll('recommendations').map(String);
    if (!selectedRecommendations.length) {
        feedback.textContent = 'Tria almenys una recomanació abans de preparar el correu.';
        return;
    }

    const center = String(formData.get('center')).trim();
    const subject = encodeURIComponent(`Experiència Dance Revolution EF · ${center}`);
    const body = encodeURIComponent([
        `Centre: ${center}`,
        `Etapa: ${String(formData.get('stage'))}`,
        `Com ha anat?: ${String(formData.get('outcome'))}`,
        `Recomanacions: ${selectedRecommendations.join('; ')}`,
        `Cançó preferida: ${String(formData.get('song'))}`,
        `Què canviaríeu o afegiríeu?: ${String(formData.get('story')).trim() || '—'}`,
        '',
        'Autorització per publicar les respostes després de revisió: sí.',
    ].join('\n'));
    const mailLink = document.createElement('a');
    mailLink.href = `mailto:anin1@xtec.cat,dparedes@xtec.cat?subject=${subject}&body=${body}`;
    mailLink.textContent = 'Obre el correu per enviar-la';
    feedback.replaceChildren(
        document.createTextNode('La web estàtica no envia les respostes automàticament. '),
        mailLink,
        document.createTextNode(' L’equip les revisarà abans d’incorporar-les al fitxer públic.'),
    );
});

const requestedTab = window.location.hash.slice(1);
const initialTab = tabPanels.some((panel) => panel.id === requestedTab) ? requestedTab : 'motivacio';
updateAdminVisibility();
openTab(initialTab, false);

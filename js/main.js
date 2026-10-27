const tabButtons = [...document.querySelectorAll('[role="tab"]')];
const tabPanels = [...document.querySelectorAll('.tab-panel')];

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

const experienceForm = document.querySelector('#experience-form');

experienceForm?.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(experienceForm);
    const center = String(formData.get('center')).trim();
    const stage = String(formData.get('stage')).trim();
    const story = String(formData.get('story')).trim();
    const publishConsent = formData.get('publishConsent') === 'on';
    const feedback = document.querySelector('#experience-feedback');

    if (!center || !stage || !story || !publishConsent) {
        feedback.textContent = 'Completa els camps i autoritza la publicació abans de preparar el missatge.';
        return;
    }

    const subject = encodeURIComponent(`Experiència Dance Revolution EF · ${center}`);
    const body = encodeURIComponent(
        `Centre: ${center}\nEtapa: ${stage}\n\nExperiència:\n${story}\n\nAutorització per revisar i publicar aquesta experiència: sí.`
    );
    const mailLink = document.createElement('a');
    mailLink.href = `mailto:anin1@xtec.cat,dparedes@xtec.cat?subject=${subject}&body=${body}`;
    mailLink.textContent = 'Obre el correu per enviar-la';

    feedback.replaceChildren(
        document.createTextNode('Missatge preparat. L’equip revisarà la proposta abans de publicar-la: '),
        mailLink
    );
});

const requestedTab = window.location.hash.slice(1);
const initialTab = tabPanels.some((panel) => panel.id === requestedTab) ? requestedTab : 'motivacio';
openTab(initialTab, false);

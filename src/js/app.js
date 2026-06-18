'use strict';

/*  Estado global  */
const APP = {
    emprendimientos: []
};

/*Local Storage*/
const LS_KEY = 'espe_emprendimientos';

function guardarEnLS() {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(APP.emprendimientos));
    } catch (e) {
        console.warn('Local Storage no disponible', e);
    }
}

function cargarDeLS() {
    try {
        const data = localStorage.getItem(LS_KEY);
        if (data) {
            APP.emprendimientos = JSON.parse(data);
            return true;
        }
    } catch (e) {
        console.warn('Error al leer el LocalStorage', e);
    }
    return false;
}

/*Categoria -> emoji */
const CATEGORIA_EMOJI = {
    'tecnologia': '💻',
    'alimentos': '🥗',
    'servicios': '🔧',
    'educacion': '📚',
    'ambiente': '🌿',
    'artesanias': '🎨',
    'salud': '❤️',
    'otros': '⭐'
};

const CATEGORIA_BADGE = {
    'tecnologia': 'badge-blue',
    'alimentos': 'badge-green',
    'servicios': 'badge-teal',
    'educacion': 'badge-purple',
    'ambiente': 'badge-green',
    'artesanias': 'badge-orange',
    'salud': 'badge-red',
    'otros': 'badge-gray'
};

const ESTADO_BADGE = {
    'idea': 'badge-gray',
    'prototipo': 'badge-gold',
    'enMarcha': 'badge-green',
    'enCrecimiento': 'badge-blue'
}

/*navegacion */

function initNav() {
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const page = link.dataset.page;
            navigateTo(page);
            //cerrar el menu movil
            document.querySelector('.navbar-nav').classList.remove('open');
        });
    });

    //hamburguesa
    const ham = document.querySelector('.navbar-hamburger');
    if (ham) {
        ham.addEventListener('click', () => {
            document.querySelector('.navbar-nav').classList.toggle('open');
        });
    }
}

function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

    const target = document.getElementById(`page-${page}`);
    const link = document.querySelector(`.nav-link[data-page="${page}"]`);
    if (target) { target.classList.add('active'); window.scrollTo(0, 0); }
    if (link) link.classList.add('active');

    //actualizar contadores del dash y en hero
    if (page === 'inicio') renderHeroStats();
    if (page === 'dashboard') { renderDashboard(); renderTabla(); }
    if (page === 'emprendimientos') renderCards();
    if (page === 'registro') actualizarCodigoAutomatico();
}

/*Generador automatico de codigo*/

function genCodigo() {
    let maxNum = 0;
    APP.emprendimientos.forEach(e => {
        const match = /EMP-(\d+)/.exec(e.codigo || '');
        if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNum) maxNum = num;
        }
    });
    const siguiente = (maxNum + 1).toString().padStart(3, '0');
    return `EMP-${siguiente}`;
}

function actualizarCodigoAutomatico() {
    const campo = document.getElementById('f-codigo');
    if (campo) campo.value = genCodigo();
}

/*Formato de Moneda*/

function formatUSD(n) {
    return '$' + Number(n).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/*toast notifications*/

function showToast(title, msg, type = 'success') {
    const toast = document.getElementById('toast');
    const icon = toast.querySelector('i');
    toast.querySelector('.toast-text strong').textContent = title;
    toast.querySelector('.toast-text span').textContent = msg;
    toast.classList.toggle('error', type === 'error');
    icon.className = type === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line';

    toast.classList.add('show');
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

/*Estadisticas Hero */
function renderHeroStats() {
    const total = APP.emprendimientos.length;
    const ventas = APP.emprendimientos.reduce((a, e) => a + Number(e.ventasMensuales), 0);
    const cats = new Set(APP.emprendimientos.map(e => e.categoria)).size;
    const activos = APP.emprendimientos.filter(e => e.estado === 'enMarcha' || e.estado === "enCrecimiento").length;

    setInner('stat-total', total);
    setInner('stat-ventas', formatUSD(ventas));
    setInner('stat-cats', cats);
    setInner('stat-activos', activos);

    //Stats banner
    setInner('banner-total', total);
    setInner('banner-ventas', formatUSD(ventas));
    setInner('banner-prom', total ? formatUSD(ventas / total) : '$0');
    setInner('banner-cats', cats);
}

function setInner(id, val) {
    const el = document.getElementById(id)
    if (el) el.textContent = val;
}

/*Card de Emprendimientos*/
function renderCards(filter = '', category = '') {
    const container = document.getElementById('cards-container');
    if (!container) return;

    let data = APP.emprendimientos;

    if (filter) {
        const f = filter.toLowerCase();
        data = data.filter(e =>
            e.nombre.toLowerCase().includes(f) ||
            e.codigo.toLowerCase().includes(f) ||
            e.responsable.toLowerCase().includes(f)
        );
    }

    if (category && category !== 'all') {
        data = data.filter(e => e.categoria === category);
    }

    if (data.length === 0) {
        container.innerHTML = `
        <div class="empty-state">
        <i class="ri-store-2-line"></i>
        <h3>Sin resultados</h3>
        <p>No se encontraron emprendimientos con los filtros aplicados.</p>
        </div>`;
        return;
    }
    container.innerHTML = data.map(e => cardHTML(e)).join('');
}

function cardHTML(e) {
    const emoji = e.emoji || CATEGORIA_EMOJI[e.categoria] || '⭐';
    const catBadge = CATEGORIA_BADGE[e.categoria] || 'badge-gray';
    const estadoBadge = ESTADO_BADGE[e.estado] || 'badge-gray';
    return `
    <article class="emp-card" data-id="${e.id}">
        <div class="emp-card-img">
            <span>${emoji}</span>
            <div class="card-estado">
                <span class="badge ${estadoBadge}">${e.estado}</span>
            </div>
        </div>
        <div class="emp-card-body">
            <div class="emp-card-category">
                <span class="badge ${catBadge}">${e.categoria}</span>
            </div>
            <h3 class="emp-card-name">${e.nombre}</h3>
            <p class="emp-card-code"># ${e.codigo}</p>
            <p class="emp-card-desc">${e.productoServicio}</p>
            <div class="emp-card-meta">
                <div class="emp-card-meta-item">
                    <i class="ri-user-line"></i>
                    <span>${e.responsable}</span>
                </div>
                <div class="emp-card-meta-item">
                    <i class="ri-building-line"></i>
                    <span>${e.carrera}</span>
                </div>
            </div>
            <div class="emp-card-ventas">
                <span>Ventas mensuales</span>
                <strong>${formatUSD(e.ventasMensuales)}</strong>
            </div>
        </div>
    </article>`;
}

/*Dashboard KPIs */

function renderDashboard() {
    const data = APP.emprendimientos;
    const total = data.length;
    const ventas = data.reduce((a, e) => a + Number(e.ventasMensuales), 0);
    const prom = total ? ventas / total : 0;

    let topEmp = null;
    if (total > 0) {
        topEmp = data.reduce((a, b) => Number(a.ventasMensuales) > Number(b.ventasMensuales) ? a : b);
    }

    setInner('kpi-total', total);
    setInner('kpi-ventas', formatUSD(ventas));
    setInner('kpi-prom', formatUSD(prom));
    setInner('kpi-categorias', new Set(data.map(e => e.categoria)).size);

    //Top emprendimiento

    const topCard = document.getElementById('top-emp-card');
    const topHidden = document.getElementById('top-emp-hidden');
    if (topEmp) {
        document.getElementById('top-nombre').textContent = topEmp.nombre;
        document.getElementById('top-ventas').innerHTML = formatUSD(topEmp.ventasMensuales) + '/mes';
        if (topCard) topCard.style.display = 'flex';
        if (topHidden) topHidden.style.display = 'none';
    } else {
        if (topCard) topCard.style.display = 'none';
        if (topHidden) topHidden.style.display = 'block';
    }
}

/*Tabla Dinamica*/
function renderTabla(filter = '', category = '') {
    const tbody = document.getElementById('tabla-body');
    if (!tbody) return;

    let data = APP.emprendimientos;
    if (filter) {
        const f = filter.toLowerCase();
        data = data.filter(e =>
            e.nombre.toLowerCase().includes(f) ||
            e.codigo.toLowerCase().includes(f)
        );
    }

    if (category && category !== 'all') {
        data = data.filter(e => e.categoria === category);
    }
    if (data.length === 0) {
        tbody.innerHTML =
            `<tr>
        <td colspan="7" class="table-empty">
            <i class="ri-inbox-line" style="font-size:2rem;color:#ccc;display:block;margin-bottom:8px">
            </i>No hay registros.
        </td>
    </tr>`;
        return;
    }

    tbody.innerHTML = data.map((e, i) => {
        const catBadge = CATEGORIA_BADGE[e.categoria] || 'badge-gray';
        const estadoBadge = ESTADO_BADGE[e.estado] || 'badge-gray';
        return `
        <tr>
            <td class="td-code">${e.codigo}</td>
            <td class="td-name">${e.nombre}</td>
            <td>${e.responsable}</td>
            <td>${e.carrera}</td>
            <td><span class="badge ${catBadge}">${e.categoria}</span></td>
            <td class="td-ventas">${formatUSD(e.ventasMensuales)}</td>
            <td><span class="badge ${estadoBadge}">${e.estado}</span></td>
        </tr>`;
    }).join('');
}

/*Formulario de registro*/

function initForm() {
    const form = document.getElementById('form-registro');
    if (!form) return;

    //precargar el codigo autogenerado al abrir el formulario
    actualizarCodigoAutomatico();

    form.addEventListener('submit', e => {
        e.preventDefault();

        if (!validarForm(form)) return;

        const codigoGenerado = genCodigo();

        const datos = {
            id: codigoGenerado,
            codigo: codigoGenerado,
            nombre: getVal('f-nombre'),
            responsable: getVal('f-responsable'),
            carrera: getVal('f-carrera'),
            categoria: getVal('f-categoria'),
            productoServicio: getVal('f-producto'),
            ventasMensuales: Number(getVal('f-ventas')),
            estado: getVal('f-estado'),
            emoji: CATEGORIA_EMOJI[getVal('f-categoria')] || '⭐'
        }

        APP.emprendimientos.push(datos);
        guardarEnLS();
        renderHeroStats();
        showToast('¡Registrado!', `"${datos.nombre}" fue guardado con el código ${datos.codigo}.`);
        resetForm(form);
        setTimeout(() => navigateTo('emprendimientos'), 1400);
    });
    //boton reset
    const btnReset = document.getElementById('btn-reset');
    if(btnReset) btnReset.addEventListener('click', () => resetForm(form));
}

function getVal(id){
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

function validarForm(form){
    const campos = form.querySelectorAll('[required]');
    let ok = true;
    campos.forEach(campo => {
        const err = document.getElementById(`err-${campo.id}`);
        if(!campo.value.trim()) {
            campo.classList.add('error');
            if(err) err.classList.add('show');
            ok = false;
        } else {
            campo.classList.remove('error');
            if (err) err.classList.remove('show');
        }
    });
    if(!ok) showToast('Campos incompletos', 'Completar todos los campos obligatorios.', 'error');
    return ok;
}

function resetForm(form){
    form.reset();
    form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    form.querySelectorAll('.error-msg').forEach(el => el.classList.remove('show'));
    actualizarCodigoAutomatico();
    showToast('Formulario restablecido', 'Los campos han sido limpiados.');
}

/*Modales genericos*/

function openModal(id){
    document.getElementById(id)?.classList.add('open');
}

function closeModal(id){
    document.getElementById(id)?.classList.remove('open');
}

/*Filtros*/
function initFilters(){
    //pagina emprendimientos
    const searchEmp = document.getElementById('search-emp');
    const filterCat = document.getElementById('filter-cat');
    if(searchEmp) searchEmp.addEventListener('input', () =>
        renderCards(searchEmp.value, filterCat?.value)
    );
    if(filterCat) filterCat.addEventListener('change', () =>
        renderCards(searchEmp?.value, filterCat.value)
    );

    //Dashboard
    const searchDash = document.getElementById('search-dash');
    const filterDash = document.getElementById('filter-dash');
    if(searchDash) searchDash.addEventListener('input', () =>
        renderTabla(searchDash.value, filterDash?.value)
    );
    if(filterDash) filterDash.addEventListener('change', () =>
        renderTabla(searchDash?.value, filterDash.value)
    );

    //category chips en el inicio
    document.querySelectorAll('.category-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const cat = chip.dataset.cat;
            navigateTo('emprendimientos');
            setTimeout(()=> {
                const fc = document.getElementById('filter-cat');
                if(fc) {fc.value = cat; renderCards('', cat); }
            }, 100);
        });
    });
}

/*Contacto*/
function initContacto(){
    const form = document.getElementById('form-contacto');
    if(!form) return;
    form.addEventListener('submit', e => {
        e.preventDefault();
        showToast('Mensaje enviado', 'Nos pondremos en contacto contigo pronto.');
        form.reset();
    });
}

/*validacion live*/
function initLiveValidation(){
    document.querySelectorAll('[required]').forEach(campo => {
        campo.addEventListener('blur', () => {
            const err = document.getElementById(`err-${campo.id}`);
            if(!campo.value.trim()){
                campo.classList.add('error');
                if(err) err.classList.add('show');
            }
        });
        campo.addEventListener('input', () => {
            if(campo.value.trim()){
                campo.classList.remove('error');
                const err = document.getElementById(`err-${campo.id}`);
                if (err) err.classList.remove('show');
            }
        });
    });
}

/*Animacion de numeros*/
function animateNumber(el, target, prefix = '', suffix = ''){
    if(!el) return;
    const duration = 1000;
    const start = Date.now();
    const tick = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed/duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(target * ease);
        el.textContent = prefix + value.toLocaleString('es-EC') + suffix;
        if(progress < 1) requestAnimationFrame(tick);
    };
    tick();
}

/*Inicializacion*/
document.addEventListener('DOMContentLoaded', () => {
    //cargar datos del local
    const loaded = cargarDeLS();
    if(!loaded) {
        APP.emprendimientos = [];
        guardarEnLS();
    }

    initNav();
    initForm();
    initFilters();
    initContacto();
    initLiveValidation();

    //pagina de inicio
    navigateTo('inicio');

    //cerrrar modales
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', e => {
            if (e.target === overlay) overlay.classList.remove('open');
        });
    });

    //exponer las funciones globales 
    window.navigateTo = navigateTo;
    window.openModal = openModal;
    window.closeModal = closeModal;
})
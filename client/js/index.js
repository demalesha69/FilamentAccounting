const API_URL = '/api';

let allFilaments = [];
let currentSort = 'default';
let currentSortBy = 'id';
let currentSortOrder = 'asc';
let isGrouped = false;

// Выбранные фильтры
let selectedTypes = [];
let selectedColors = [];
let selectedManufacturers = [];
let selectedCompositions = [];

let currentSearchQuery = '';
let currentFilamentId = null;
let compositionData = [];

// Состояния аккордеонов
let typeFilterExpanded = false;
let colorFilterExpanded = false;
let manufacturerFilterExpanded = false;
let compositionFilterExpanded = false;

// Кеш для уникальных значений
let uniqueTypes = [];
let uniqueColors = [];
let uniqueManufacturers = [];
let uniqueCompositions = [];

// Состояние навигации по группам
let groupNavigationStack = [];
let isInGroupView = false;
let currentGroupKey = null;

// Флаг для предотвращения рекурсивного обновления типа
let isUpdatingTypeFromComposition = false;

const MAX_FILAMENT_LENGTH = 100000000;

// ===== СПИСОК МАТЕРИАЛОВ, КОТОРЫЕ МОГУТ БЫТЬ ОСНОВНЫМ ТИПОМ =====
const PRIMARY_MATERIALS = [
    'pla', 'petg', 'abs', 'hips', 'sbs', 'tpu', 'nylon', 'asa', 
    'pp', 'pc', 'pom', 'pmma', 'peek', 'ceramo', 'pva', 'wax', 'clearing'
];

// ===== СПИСОК ДОПОЛНИТЕЛЬНЫХ МАТЕРИАЛОВ (НЕ МОГУТ БЫТЬ ОСНОВНЫМ ТИПОМ) =====
const SECONDARY_MATERIALS = [
    'углеволокно', 'стекловолокно', 'кевлар', 'металлик', 'дерево', 'светящийся', 'другое'
];

// ===== СЛОВАРЬ ПЛОТНОСТЕЙ МАТЕРИАЛОВ =====
const MATERIAL_DENSITY = {
    'pla': 1.24,
    'petg': 1.27,
    'abs': 1.04,
    'hips': 1.04,
    'sbs': 1.02,
    'tpu': 1.20,
    'nylon': 1.14,
    'asa': 1.07,
    'pp': 0.90,
    'pc': 1.20,
    'pom': 1.41,
    'pmma': 1.18,
    'peek': 1.32,
    'ceramo': 1.20,
    'pva': 1.19,
    'wax': 0.95,
    'clearing': 1.00,
    'углеволокно': 1.80,
    'стекловолокно': 1.40,
    'кевлар': 1.44,
    'металлик': 2.50,
    'дерево': 0.60,
    'светящийся': 1.20,
    'другое': 1.00
};

const MATERIAL_DEFAULTS = {
    'pla': { density: 1.24, diameter: 1.75 },
    'petg': { density: 1.27, diameter: 1.75 },
    'abs': { density: 1.04, diameter: 1.75 },
    'hips': { density: 1.04, diameter: 1.75 },
    'sbs': { density: 1.02, diameter: 1.75 },
    'tpu': { density: 1.20, diameter: 1.75 },
    'nylon': { density: 1.14, diameter: 1.75 },
    'asa': { density: 1.07, diameter: 1.75 },
    'pp': { density: 0.90, diameter: 1.75 },
    'pc': { density: 1.20, diameter: 1.75 },
    'pom': { density: 1.41, diameter: 1.75 },
    'pmma': { density: 1.18, diameter: 1.75 },
    'peek': { density: 1.32, diameter: 1.75 },
    'ceramo': { density: 1.20, diameter: 1.75 },
    'pva': { density: 1.19, diameter: 1.75 },
    'wax': { density: 0.95, diameter: 1.75 },
    'clearing': { density: 1.00, diameter: 1.75 }
};

const COLOR_MAP = {
    'green': '#22c55e',
    'yellow': '#eab308',
    'red': '#ef4444',
    'blue': '#3b82f6',
    'orange': '#f97316',
    'purple': '#a855f7',
    'black': '#1a1a1a',
    'white': '#f3f4f6',
    'gray': '#6b7280',
    'silver': '#c0c0c0',
    'crimson': '#dc2626',
    'pink': '#ec4899',
    'gold': '#f59e0b',
    'lime': '#84cc16',
    'teal': '#14b8a6',
    'cyan': '#06b6d4',
    'navy': '#1e3a8a',
    'violet': '#8b5cf6',
    'magenta': '#d946ef',
    'brown': '#92400e',
    'beige': '#f5e6d3',
    'transparent': 'rgba(255,255,255,0.1)',
    'glow': '#22d3ee',
    'multicolor': '#8b5cf6'
};

const COLOR_NAMES = {
    'green': 'Зеленый',
    'yellow': 'Желтый',
    'red': 'Красный',
    'blue': 'Синий',
    'orange': 'Оранжевый',
    'purple': 'Фиолетовый',
    'black': 'Черный',
    'white': 'Белый',
    'gray': 'Серый',
    'silver': 'Серебристый',
    'crimson': 'Малиновый',
    'pink': 'Розовый',
    'gold': 'Золотой',
    'lime': 'Лайм',
    'teal': 'Бирюзовый',
    'cyan': 'Циан',
    'navy': 'Темно-синий',
    'violet': 'Лиловый',
    'magenta': 'Пурпурный',
    'brown': 'Коричневый',
    'beige': 'Бежевый',
    'transparent': 'Прозрачный',
    'glow': 'Светящийся',
    'multicolor': 'Мультицвет'
};

const RING_COLOR_MAP = {
    'green': '#22c55e',
    'yellow': '#eab308',
    'red': '#ef4444',
    'blue': '#3b82f6',
    'orange': '#f97316',
    'purple': '#a855f7',
    'black': '#4a4a4a',
    'white': '#e5e7eb',
    'gray': '#9ca3af',
    'silver': '#d1d5db',
    'crimson': '#dc2626',
    'pink': '#ec4899',
    'gold': '#f59e0b',
    'lime': '#84cc16',
    'teal': '#14b8a6',
    'cyan': '#06b6d4',
    'navy': '#3b82f6',
    'violet': '#8b5cf6',
    'magenta': '#d946ef',
    'brown': '#b45309',
    'beige': '#d4c5b0',
    'transparent': '#9ca3af',
    'glow': '#22d3ee',
    'multicolor': '#8b5cf6'
};

function formatLength(mm) {
    if (mm >= 100000000) {
        return (mm / 1000000).toFixed(3) + ' км';
    } else if (mm >= 1000000) {
        return (mm / 1000000).toFixed(2) + ' км';
    } else if (mm >= 1000) {
        return (mm / 1000).toFixed(2) + ' м';
    }
    return mm + ' мм';
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    const messageEl = document.getElementById('notificationMessage');
    const iconEl = document.getElementById('notificationIcon');
    
    notification.className = 'notification';
    notification.classList.add(type);
    
    const icons = {
        success: 'fa-solid fa-check-circle',
        error: 'fa-solid fa-circle-exclamation',
        info: 'fa-solid fa-circle-info'
    };
    iconEl.className = icons[type] || icons.success;
    messageEl.textContent = message;
    notification.style.display = 'block';
    
    clearTimeout(notification._timeout);
    notification._timeout = setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

document.addEventListener('click', function(e) {
    const notification = document.getElementById('notification');
    if (notification && notification.contains(e.target)) {
        notification.style.display = 'none';
    }
});

function formatLocalDate(timestamp) {
    if (!timestamp) return '';
    try {
        let ts = timestamp;
        if (typeof ts === 'number' && ts < 10000000000) {
            ts = ts * 1000;
        }
        const date = new Date(ts);
        if (isNaN(date.getTime())) return String(timestamp);
        return date.toLocaleString();
    } catch (e) {
        return String(timestamp);
    }
}

function toggleAdvancedSettings() {
    const settings = document.getElementById('advancedSettings');
    const icon = document.getElementById('advancedIcon');
    if (settings.style.display === 'none') {
        settings.style.display = 'block';
        icon.className = 'fa-solid fa-gear fa-spin';
    } else {
        settings.style.display = 'none';
        icon.className = 'fa-solid fa-gear';
    }
}

// ===== ФУНКЦИЯ ДЛЯ ПРОВЕРКИ, ЯВЛЯЕТСЯ ЛИ МАТЕРИАЛ ДОПОЛНИТЕЛЬНЫМ =====
function isSecondaryMaterial(material) {
    if (!material) return false;
    const normalized = material.toLowerCase();
    return SECONDARY_MATERIALS.includes(normalized);
}

// ===== ФУНКЦИЯ ДЛЯ ПРОВЕРКИ, ЯВЛЯЕТСЯ ЛИ МАТЕРИАЛ ОСНОВНЫМ =====
function isPrimaryMaterial(material) {
    if (!material) return false;
    const normalized = material.toLowerCase();
    return PRIMARY_MATERIALS.includes(normalized);
}

// ===== ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ МАТЕРИАЛА С НАИБОЛЬШИМ ПРОЦЕНТОМ СРЕДИ ОСНОВНЫХ =====
function getPrimaryMaterialWithMaxPercent(composition) {
    if (!composition || composition.length === 0) {
        return null;
    }
    
    let maxPercent = 0;
    let materialWithMaxPercent = null;
    
    for (const item of composition) {
        const percent = item.percent || 0;
        const material = item.material;
        
        // Учитываем только основные материалы
        if (isPrimaryMaterial(material) && percent > maxPercent) {
            maxPercent = percent;
            materialWithMaxPercent = material;
        }
    }
    
    return materialWithMaxPercent;
}

// ===== ФУНКЦИЯ ДЛЯ ПРОВЕРКИ, ЕСТЬ ЛИ В СОСТАВЕ ТОЛЬКО ДОПОЛНИТЕЛЬНЫЕ МАТЕРИАЛЫ =====
function hasOnlySecondaryMaterials(composition) {
    if (!composition || composition.length === 0) {
        return false;
    }
    
    for (const item of composition) {
        if (isPrimaryMaterial(item.material)) {
            return false;
        }
    }
    
    return true;
}

// ===== ФУНКЦИЯ ДЛЯ ПРОВЕРКИ ПРЕВЫШЕНИЯ ЛИМИТА ДОПОЛНИТЕЛЬНЫХ МАТЕРИАЛОВ =====
function checkSecondaryMaterialLimit(composition) {
    if (!composition || composition.length === 0) {
        return { valid: true };
    }
    
    const errors = [];
    
    for (const item of composition) {
        if (isSecondaryMaterial(item.material)) {
            const percent = item.percent || 0;
            if (percent > 50) {
                errors.push({
                    material: item.material,
                    percent: percent
                });
            }
        }
    }
    
    if (errors.length > 0) {
        return { valid: false, errors: errors };
    }
    
    return { valid: true };
}

// ===== АВТОМАТИЧЕСКОЕ ОБНОВЛЕНИЕ ТИПА НА ОСНОВЕ СОСТАВА =====
function updateMaterialTypeFromComposition() {
    // Предотвращаем рекурсивные вызовы
    if (isUpdatingTypeFromComposition) {
        return;
    }
    
    const typeSelect = document.getElementById('filamentType');
    if (!typeSelect) return;
    
    // Проверяем, есть ли в составе только дополнительные материалы
    if (hasOnlySecondaryMaterials(compositionData)) {
        // Если есть только дополнительные материалы, показываем уведомление
        const secondaryMaterials = compositionData.map(item => item.material).join(', ');
        showNotification(
            `В составе только дополнительные материалы (${secondaryMaterials}). Выберите основной тип материала вручную.`,
            'info'
        );
        return;
    }
    
    // Находим основной материал с максимальным процентом
    const primaryMaterial = getPrimaryMaterialWithMaxPercent(compositionData);
    
    if (primaryMaterial) {
        const normalizedPrimary = primaryMaterial.toLowerCase();
        
        // Проверяем, совпадает ли текущий выбранный тип с основным материалом
        const currentType = typeSelect.value.toLowerCase();
        
        // Если текущий тип уже соответствует основному материалу, ничего не делаем
        if (currentType === normalizedPrimary) {
            return;
        }
        
        // Проверяем, не был ли тип установлен вручную пользователем
        const hasMatchingMaterial = compositionData.some(item => 
            item.material.toLowerCase() === currentType && isPrimaryMaterial(item.material)
        );
        
        // Если пользователь выбрал основной тип, который есть в составе, не перезаписываем его
        if (hasMatchingMaterial && currentType !== '') {
            return;
        }
        
        // Находим соответствующий тип в списке
        const options = typeSelect.options;
        let found = false;
        
        for (let i = 0; i < options.length; i++) {
            const optionValue = options[i].value.toLowerCase();
            if (optionValue === normalizedPrimary) {
                isUpdatingTypeFromComposition = true;
                typeSelect.value = options[i].value;
                isUpdatingTypeFromComposition = false;
                found = true;
                break;
            }
        }
        
        if (found) {
            // Обновляем расширенные настройки
            updateAdvancedDefaults();
            // Визуально показываем, что тип был установлен автоматически
            typeSelect.style.borderColor = '#4ade80';
            setTimeout(() => {
                typeSelect.style.borderColor = '';
            }, 2000);
        }
    }
}

// ===== РАСЧЕТ ПЛОТНОСТИ КОМПОЗИТА =====
function calculateCompositeDensity(composition) {
    if (!composition || composition.length === 0) {
        return 1.24;
    }
    
    const totalPercent = composition.reduce((sum, item) => sum + (item.percent || 0), 0);
    if (totalPercent === 0) return 1.24;
    
    let weightedDensity = 0;
    for (const item of composition) {
        const materialKey = item.material.toLowerCase();
        const density = MATERIAL_DENSITY[materialKey] || 1.24;
        const percent = (item.percent || 0) / 100;
        weightedDensity += density * percent;
    }
    
    if (Math.abs(totalPercent - 100) > 0.01) {
        weightedDensity = weightedDensity / (totalPercent / 100);
    }
    
    return Math.round(weightedDensity * 100) / 100;
}

function updateDensityFromComposition() {
    const total = compositionData.reduce((sum, item) => sum + (item.percent || 0), 0);
    const densityInput = document.getElementById('filamentDensity');
    const calcDensityEl = document.getElementById('calculatedDensity');
    
    if (!densityInput) return;
    
    if (Math.abs(total - 100) > 0.01) {
        densityInput.style.borderColor = '#f59e0b';
        if (calcDensityEl) {
            calcDensityEl.textContent = '— (сумма ≠ 100%)';
            calcDensityEl.style.color = '#f59e0b';
        }
        return;
    }
    
    const density = calculateCompositeDensity(compositionData);
    densityInput.value = density;
    densityInput.style.borderColor = '#4ade80';
    
    if (calcDensityEl) {
        calcDensityEl.textContent = density.toFixed(2) + ' г/см³';
        calcDensityEl.style.color = '#4ade80';
    }
}

function updateAdvancedDefaults() {
    const type = document.getElementById('filamentType').value;
    const defaults = MATERIAL_DEFAULTS[type];
    if (defaults) {
        if (compositionData.length === 1 && compositionData[0].percent === 100) {
            const densityInput = document.getElementById('filamentDensity');
            if (densityInput) {
                densityInput.value = defaults.density;
                densityInput.style.borderColor = '';
            }
        } else {
            updateDensityFromComposition();
        }
        document.getElementById('filamentDiameter').value = defaults.diameter;
    }
    syncCompositionWithType();
}

function syncCompositionWithType() {
    const type = document.getElementById('filamentType').value;
    if (!type) return;
    
    // Проверяем, есть ли уже состав с этим материалом
    const hasMaterial = compositionData.some(item => 
        item.material.toLowerCase() === type.toLowerCase()
    );
    
    // Если состав пустой или состоит из одного материала 100%
    if (compositionData.length === 0 || 
        (compositionData.length === 1 && compositionData[0].percent === 100 && 
         compositionData[0].material === type.toLowerCase())) {
        compositionData = [{ material: type.toLowerCase(), percent: 100 }];
        renderCompositionList();
        updateCompositionTotal();
    }
}

// ===== УПРАВЛЕНИЕ РАСКРЫТИЕМ =====

function toggleElement(containerId, toggleId, expandedVar) {
    const container = document.getElementById(containerId);
    const toggle = document.getElementById(toggleId);
    const chevron = toggle?.querySelector('.fa-chevron-down');
    
    if (expandedVar) {
        container.style.display = 'none';
        if (chevron) chevron.className = 'fa-solid fa-chevron-down';
    } else {
        container.style.display = 'flex';
        if (chevron) chevron.className = 'fa-solid fa-chevron-up';
    }
    return !expandedVar;
}

function toggleTypeFilter() {
    typeFilterExpanded = toggleElement('typeFilterContainer', 'filterTypeToggle', typeFilterExpanded);
    if (typeFilterExpanded) updateTypeFilterList();
}

function toggleColorFilter() {
    colorFilterExpanded = toggleElement('colorFilterContainer', 'filterColorToggle', colorFilterExpanded);
    if (colorFilterExpanded) updateColorFilterList();
}

function toggleManufacturerFilter() {
    manufacturerFilterExpanded = toggleElement('manufacturerFilterContainer', 'filterManufacturerToggle', manufacturerFilterExpanded);
    if (manufacturerFilterExpanded) updateManufacturerFilterList();
}

function toggleCompositionFilter() {
    compositionFilterExpanded = toggleElement('compositionFilterContainer', 'filterCompositionToggle', compositionFilterExpanded);
    if (compositionFilterExpanded) updateCompositionFilterList();
}

// ===== ОБНОВЛЕНИЕ ЛЕЙБЛОВ =====

function updateTypeLabel() {
    const label = document.getElementById('filterTypeLabel');
    const count = document.getElementById('filterTypeCount');
    if (!label) return;
    
    if (selectedTypes.length === 0) {
        label.textContent = 'Все типы';
        if (count) count.style.display = 'none';
    } else if (selectedTypes.length === 1) {
        label.textContent = selectedTypes[0].toUpperCase();
        if (count) count.style.display = 'none';
    } else {
        label.textContent = `Типы (${selectedTypes.length})`;
        if (count) {
            count.textContent = `+${selectedTypes.length}`;
            count.style.display = 'inline';
        }
    }
}

function updateColorLabel() {
    const label = document.getElementById('filterColorLabel');
    const count = document.getElementById('filterColorCount');
    if (!label) return;
    
    if (selectedColors.length === 0) {
        label.textContent = 'Все цвета';
        if (count) count.style.display = 'none';
    } else if (selectedColors.length === 1) {
        label.textContent = COLOR_NAMES[selectedColors[0]] || selectedColors[0];
        if (count) count.style.display = 'none';
    } else {
        label.textContent = `Цвета (${selectedColors.length})`;
        if (count) {
            count.textContent = `+${selectedColors.length}`;
            count.style.display = 'inline';
        }
    }
}

function updateManufacturerLabel() {
    const label = document.getElementById('filterManufacturerLabel');
    const count = document.getElementById('filterManufacturerCount');
    if (!label) return;
    
    if (selectedManufacturers.length === 0) {
        label.textContent = 'Все производители';
        if (count) count.style.display = 'none';
    } else if (selectedManufacturers.length === 1) {
        label.textContent = selectedManufacturers[0];
        if (count) count.style.display = 'none';
    } else {
        label.textContent = `Производители (${selectedManufacturers.length})`;
        if (count) {
            count.textContent = `+${selectedManufacturers.length}`;
            count.style.display = 'inline';
        }
    }
}

// ===== НОРМАЛИЗАЦИЯ СОСТАВА ДЛЯ ОТОБРАЖЕНИЯ =====
function normalizeCompositionDisplay(composition) {
    if (!composition || composition.length === 0) return '';
    
    // Сортируем материалы по алфавиту для единообразия
    const sorted = [...composition].sort((a, b) => {
        return a.material.localeCompare(b.material);
    });
    
    // Формируем строку: "материал1 + материал2 + ..."
    return sorted.map(item => item.material).join(' + ');
}

// ===== ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ УНИКАЛЬНЫХ СОСТАВОВ =====
function getUniqueCompositions(filaments) {
    const compMap = new Map();
    
    for (const f of filaments) {
        if (f.composition && Array.isArray(f.composition) && f.composition.length > 0) {
            const key = normalizeCompositionDisplay(f.composition);
            if (!compMap.has(key)) {
                compMap.set(key, key);
            }
        }
    }
    
    return Array.from(compMap.values()).sort();
}

// ===== ФУНКЦИЯ ДЛЯ ФОРМИРОВАНИЯ ПАРАМЕТРОВ СОСТАВА ДЛЯ ЗАПРОСА =====
function buildCompositionParams(selectedCompositions) {
    const params = [];
    
    for (const comp of selectedCompositions) {
        if (!comp) continue;
        
        const materials = comp.split(' + ').map(m => m.toLowerCase().trim());
        
        for (const material of materials) {
            if (material) {
                params.push(material + '_TRUE');
            }
        }
    }
    
    return params;
}

// ===== ОБНОВЛЕНИЕ ЛЕЙБЛА СОСТАВА =====
function updateCompositionLabel() {
    const label = document.getElementById('filterCompositionLabel');
    const count = document.getElementById('filterCompositionCount');
    if (!label) return;
    
    if (selectedCompositions.length === 0) {
        label.textContent = 'Все составы';
        if (count) count.style.display = 'none';
    } else if (selectedCompositions.length === 1) {
        const display = selectedCompositions[0];
        label.textContent = display.length > 30 ? display.substring(0, 27) + '...' : display;
        if (count) count.style.display = 'none';
    } else {
        label.textContent = `Составы (${selectedCompositions.length})`;
        if (count) {
            count.textContent = `+${selectedCompositions.length}`;
            count.style.display = 'inline';
        }
    }
}

// ===== УПРАВЛЕНИЕ СОСТАВОМ =====

function openCompositionModal() {
    if (compositionData.length === 0) {
        const defaultType = document.getElementById('filamentType').value || 'pla';
        compositionData = [{ material: defaultType.toLowerCase(), percent: 100 }];
    }
    
    renderCompositionList();
    document.getElementById('compositionModal').style.display = 'flex';
    updateCompositionTotal();
}

function closeCompositionModal() {
    document.getElementById('compositionModal').style.display = 'none';
}

function renderCompositionList() {
    const list = document.getElementById('compositionList');
    if (!list) return;
    
    list.innerHTML = compositionData.map((item, index) => `
        <div class="composition-item" style="display:flex; align-items:center; gap:10px; background:#232734; border-radius:10px; padding:8px 12px;">
            <select class="composition-material" data-index="${index}" style="flex:1; background:#1a1d26; border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:8px 12px; color:#ffffff; font-size:14px;">
                ${getMaterialOptions(item.material)}
            </select>
            <input type="number" class="composition-percent" data-index="${index}" placeholder="%" value="${item.percent}" min="0" max="100" style="width:70px; background:#1a1d26; border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:8px 10px; color:#ffffff; font-size:14px; text-align:center;" oninput="updateCompositionTotal()" />
            <button class="remove-composition" onclick="removeCompositionItem(${index})" style="background:transparent; border:none; color:#ff5f5f; cursor:pointer; font-size:18px; padding:4px 8px;">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
    `).join('');
    
    document.querySelectorAll('.composition-material').forEach(select => {
        select.addEventListener('change', function() {
            const index = parseInt(this.dataset.index);
            compositionData[index].material = this.value;
            updateCompositionTotal();
            updateMaterialTypeFromComposition();
        });
    });
    
    document.querySelectorAll('.composition-percent').forEach(input => {
        input.addEventListener('input', function() {
            const index = parseInt(this.dataset.index);
            compositionData[index].percent = parseFloat(this.value) || 0;
            updateCompositionTotal();
            updateMaterialTypeFromComposition();
        });
    });
    
    updateDensityFromComposition();
}

function getMaterialOptions(selected) {
    const materials = ['pla', 'petg', 'abs', 'hips', 'sbs', 'tpu', 'nylon', 'asa', 'pp', 'pc', 'pom', 'pmma', 'peek', 'ceramo', 'pva', 'wax', 'clearing', 'углеволокно', 'стекловолокно', 'кевлар', 'металлик', 'дерево', 'светящийся', 'другое'];
    return materials.map(m => `<option value="${m}" ${m === selected ? 'selected' : ''}>${m.charAt(0).toUpperCase() + m.slice(1)}</option>`).join('');
}

function addCompositionItem() {
    compositionData.push({ material: 'другое', percent: 0 });
    renderCompositionList();
    updateCompositionTotal();
}

function removeCompositionItem(index) {
    if (compositionData.length <= 1) {
        showNotification('Должен быть хотя бы один компонент', 'error');
        return;
    }
    compositionData.splice(index, 1);
    renderCompositionList();
    updateCompositionTotal();
    updateMaterialTypeFromComposition();
}

function updateCompositionTotal() {
    const total = compositionData.reduce((sum, item) => sum + (item.percent || 0), 0);
    const totalEl = document.getElementById('compositionTotal');
    if (totalEl) {
        totalEl.textContent = Math.round(total);
        totalEl.style.color = Math.abs(total - 100) < 0.01 ? '#4ade80' : '#f59e0b';
    }
    
    updateDensityFromComposition();
}

function saveComposition() {
    const total = compositionData.reduce((sum, item) => sum + (item.percent || 0), 0);
    if (Math.abs(total - 100) > 0.01) {
        showNotification(`Сумма компонентов должна быть 100% (сейчас ${Math.round(total)}%)`, 'error');
        return;
    }
    
    const invalidItems = compositionData.filter(item => (item.percent || 0) <= 0);
    if (invalidItems.length > 0) {
        showNotification('Все компоненты должны иметь процент > 0', 'error');
        return;
    }
    
    // Проверяем, есть ли в составе только дополнительные материалы
    if (hasOnlySecondaryMaterials(compositionData)) {
        const secondaryMaterials = compositionData.map(item => item.material).join(', ');
        showNotification(
            `В составе только дополнительные материалы (${secondaryMaterials}). Добавьте основной материал или выберите тип вручную.`,
            'info'
        );
        return;
    }
    
    // Проверяем лимит дополнительных материалов (не более 50%)
    const limitCheck = checkSecondaryMaterialLimit(compositionData);
    if (!limitCheck.valid) {
        const errors = limitCheck.errors.map(e => `"${e.material}" (${e.percent}%)`).join(', ');
        showNotification(
            `Дополнительные материалы не могут превышать 50%: ${errors}`,
            'error'
        );
        return;
    }
    
    const density = calculateCompositeDensity(compositionData);
    const densityInput = document.getElementById('filamentDensity');
    if (densityInput) {
        densityInput.value = density;
        densityInput.style.borderColor = '#4ade80';
    }
    
    updateMaterialTypeFromComposition();
    
    showNotification(`Состав сохранен! Расчетная плотность: ${density} г/см³`, 'success');
    closeCompositionModal();
}

// ===== АВТОРИЗАЦИЯ =====

async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        redirectToLogin();
        return false;
    }
    try {
        const response = await fetch(`${API_URL}/materials/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            redirectToLogin();
            return false;
        }
        if (response.ok) {
            updateAuthUI(true);
            showUsername();
            return true;
        }
        return false;
    } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
        showNotification('Ошибка подключения к серверу', 'error');
        return false;
    }
}

function redirectToLogin() {
    const currentPath = window.location.pathname;
    if (!currentPath.includes('login.html') && !currentPath.includes('register.html')) {
        window.location.href = 'login.html';
    }
}

function updateAuthUI(isLoggedIn) {
    const container = document.getElementById('authContainer');
    if (!container) return;
    if (isLoggedIn) {
        container.innerHTML = `
            <span style="color:#9ca3af; font-size:14px;" id="usernameDisplay"></span>
            <button class="icon-button" onclick="logout()" title="Выйти">
                <i class="fa-solid fa-right-from-bracket"></i>
            </button>
        `;
    } else {
        container.innerHTML = `
            <a href="login.html" class="icon-button" title="Войти">
                <i class="fa-solid fa-right-to-bracket"></i>
            </a>
        `;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

function showUsername() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const display = document.getElementById('usernameDisplay');
        if (display) display.textContent = user.username || 'Пользователь';
    } catch (e) {}
}

// ===== ПОЛУЧЕНИЕ УНИКАЛЬНЫХ ЗНАЧЕНИЙ =====

async function fetchUniqueValues(field) {
    const token = localStorage.getItem('token');
    if (!token) return [];
    
    try {
        const response = await fetch(`${API_URL}/materials/actual/${field}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            redirectToLogin();
            return [];
        }
        
        const data = await response.json();
        if (data.status !== 200) {
            console.error('Ошибка получения уникальных значений:', data.message);
            return [];
        }
        
        return data.data || [];
    } catch (error) {
        console.error(`Ошибка получения уникальных значений для ${field}:`, error);
        return [];
    }
}

// ===== ЗАГРУЗКА УНИКАЛЬНЫХ ЗНАЧЕНИЙ =====
async function loadUniqueValues() {
    const [types, colors, manufacturers, compositions] = await Promise.all([
        fetchUniqueValues('type'),
        fetchUniqueValues('color'),
        fetchUniqueValues('manufacturer'),
        fetchUniqueValues('composition')
    ]);
    
    uniqueTypes = types;
    uniqueColors = colors;
    uniqueManufacturers = manufacturers;
    
    const compSet = new Set();
    
    if (Array.isArray(compositions)) {
        for (const comp of compositions) {
            let key = '';
            if (Array.isArray(comp)) {
                key = normalizeCompositionDisplay(comp);
            } else if (typeof comp === 'string') {
                key = comp;
            }
            if (key) {
                compSet.add(key);
            }
        }
    }
    
    uniqueCompositions = Array.from(compSet).sort();
}

// ===== ФИЛЬТРЫ =====

function closeFilter() {
    document.getElementById('filterModal').style.display = 'none';
}

function openFilter() {
    document.getElementById('filterModal').style.display = 'flex';
    
    updateTypeLabel();
    updateColorLabel();
    updateManufacturerLabel();
    updateCompositionLabel();
    
    if (typeFilterExpanded) updateTypeFilterList();
    if (colorFilterExpanded) updateColorFilterList();
    if (manufacturerFilterExpanded) updateManufacturerFilterList();
    if (compositionFilterExpanded) updateCompositionFilterList();
}

document.getElementById('filterModal').addEventListener('click', function(e) {
    if (e.target === this) closeFilter();
});

// ===== ОБНОВЛЕНИЕ СПИСКОВ =====

function updateTypeFilterList() {
    const container = document.getElementById('typeFilterContainer');
    if (!container) return;
    
    if (uniqueTypes.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:8px;color:#6b7280;font-size:13px;">Нет типов</div>`;
        return;
    }
    
    container.innerHTML = uniqueTypes.map(t => {
        const isSelected = selectedTypes.includes(t);
        return `
            <button class="filter-option ${isSelected ? 'active' : ''}" onclick="toggleType('${t}')" style="padding:6px 12px; font-size:13px;">
                <i class="fa-solid ${isSelected ? 'fa-check-circle' : 'fa-circle'}"></i>
                <span>${t.toUpperCase()}</span>
            </button>
        `;
    }).join('');
}

function updateColorFilterList() {
    const container = document.getElementById('colorFilterContainer');
    if (!container) return;
    
    if (uniqueColors.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:8px;color:#6b7280;font-size:13px;">Нет цветов</div>`;
        return;
    }
    
    container.innerHTML = uniqueColors.map(c => {
        const isSelected = selectedColors.includes(c);
        const colorHex = COLOR_MAP[c] || '#8b5cf6';
        const colorName = COLOR_NAMES[c] || c;
        return `
            <button class="filter-option ${isSelected ? 'active' : ''}" onclick="toggleColor('${c}')" style="padding:6px 12px; font-size:13px;">
                <i class="fa-solid ${isSelected ? 'fa-check-circle' : 'fa-circle'}"></i>
                <span style="display:inline-block; width:14px; height:14px; border-radius:50%; background:${colorHex}; margin:0 8px;"></span>
                <span>${colorName}</span>
            </button>
        `;
    }).join('');
}

function updateManufacturerFilterList() {
    const container = document.getElementById('manufacturerFilterContainer');
    if (!container) return;
    
    if (uniqueManufacturers.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:8px;color:#6b7280;font-size:13px;">Нет производителей</div>`;
        return;
    }
    
    container.innerHTML = uniqueManufacturers.map(m => {
        const isSelected = selectedManufacturers.includes(m);
        const escapedM = m.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        return `
            <button class="filter-option ${isSelected ? 'active' : ''}" onclick="toggleManufacturer('${escapedM}')" style="padding:6px 12px; font-size:13px;">
                <i class="fa-solid ${isSelected ? 'fa-check-circle' : 'fa-circle'}"></i>
                <span>${m}</span>
            </button>
        `;
    }).join('');
}

// ===== ОБНОВЛЕНИЕ СПИСКА СОСТАВОВ =====
function updateCompositionFilterList() {
    const container = document.getElementById('compositionFilterContainer');
    if (!container) return;
    
    if (uniqueCompositions.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:8px;color:#6b7280;font-size:13px;">Нет составов</div>`;
        return;
    }
    
    container.innerHTML = uniqueCompositions.map(c => {
        const isSelected = selectedCompositions.includes(c);
        const escapedC = c.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const displayText = c.length > 30 ? c.substring(0, 27) + '...' : c;
        return `
            <button class="filter-option ${isSelected ? 'active' : ''}" onclick="toggleComposition('${escapedC}')" style="padding:6px 12px; font-size:13px;">
                <i class="fa-solid ${isSelected ? 'fa-check-circle' : 'fa-circle'}"></i>
                <span>${displayText}</span>
            </button>
        `;
    }).join('');
}

// ===== ПЕРЕКЛЮЧЕНИЕ ФИЛЬТРОВ =====

function toggleType(type) {
    const index = selectedTypes.indexOf(type);
    if (index === -1) {
        selectedTypes.push(type);
    } else {
        selectedTypes.splice(index, 1);
    }
    updateTypeFilterList();
    updateTypeLabel();
}

function toggleColor(color) {
    const index = selectedColors.indexOf(color);
    if (index === -1) {
        selectedColors.push(color);
    } else {
        selectedColors.splice(index, 1);
    }
    updateColorFilterList();
    updateColorLabel();
}

function toggleManufacturer(manufacturer) {
    const index = selectedManufacturers.indexOf(manufacturer);
    if (index === -1) {
        selectedManufacturers.push(manufacturer);
    } else {
        selectedManufacturers.splice(index, 1);
    }
    updateManufacturerFilterList();
    updateManufacturerLabel();
}

// ===== ПЕРЕКЛЮЧЕНИЕ ФИЛЬТРА СОСТАВА =====
function toggleComposition(composition) {
    const index = selectedCompositions.indexOf(composition);
    if (index === -1) {
        selectedCompositions.push(composition);
    } else {
        selectedCompositions.splice(index, 1);
    }
    updateCompositionFilterList();
    updateCompositionLabel();
}

// ===== ПЕРЕКЛЮЧЕНИЕ ГРУППИРОВКИ =====

function toggleGrouping() {
    isGrouped = !isGrouped;
    saveGroupingState(isGrouped);
    
    const btn = document.getElementById('groupToggleBtn');
    if (btn) {
        if (isGrouped) {
            btn.classList.add('active');
            btn.innerHTML = '<i class="fa-solid fa-layer-group"></i> Группировка включена';
        } else {
            btn.classList.remove('active');
            btn.innerHTML = '<i class="fa-solid fa-layer-group"></i> Группировка отключена';
        }
    }
    
    if (isInGroupView) {
        exitGroupView();
    }
    
    loadFilaments();
}

// ===== СОРТИРОВКА =====

function setSort(type) {
    currentSort = type;
    
    switch(type) {
        case 'default':
            currentSortBy = 'id';
            currentSortOrder = 'asc';
            break;
        case 'name':
            currentSortBy = 'name';
            currentSortOrder = 'asc';
            break;
        case 'nameDesc':
            currentSortBy = 'name';
            currentSortOrder = 'desc';
            break;
        case 'progress':
            currentSortBy = 'current_length';
            currentSortOrder = 'asc';
            break;
        case 'progressDesc':
            currentSortBy = 'current_length';
            currentSortOrder = 'desc';
            break;
        default:
            currentSortBy = 'id';
            currentSortOrder = 'asc';
    }
    
    document.querySelectorAll('.filter-option').forEach(btn => btn.classList.remove('active'));
    const activeBtn = { 
        'default': 'filterDefault', 
        'name': 'filterName', 
        'nameDesc': 'filterNameDesc', 
        'progress': 'filterProgress', 
        'progressDesc': 'filterProgressDesc'
    }[type];
    if (activeBtn) document.getElementById(activeBtn).classList.add('active');
}

// ===== ПОИСК =====

function searchFilaments() {
    currentSearchQuery = document.getElementById('searchInput')?.value.trim() || '';
    loadFilaments();
}

// ===== ПРИМЕНЕНИЕ ФИЛЬТРОВ =====

function applyFilters() {
    loadFilaments();
    closeFilter();
}

// ===== СБРОС ФИЛЬТРОВ =====

function resetFilters() {
    currentSort = 'default';
    currentSortBy = 'id';
    currentSortOrder = 'asc';
    selectedTypes = [];
    selectedColors = [];
    selectedManufacturers = [];
    selectedCompositions = [];
    currentSearchQuery = '';
    document.getElementById('searchInput').value = '';
    
    const btn = document.getElementById('groupToggleBtn');
    if (btn) {
        if (isGrouped) {
            btn.classList.add('active');
            btn.innerHTML = '<i class="fa-solid fa-layer-group"></i> Группировка включена';
        } else {
            btn.classList.remove('active');
            btn.innerHTML = '<i class="fa-solid fa-layer-group"></i> Группировка отключена';
        }
    }
    
    document.querySelectorAll('.filter-option').forEach(btn => btn.classList.remove('active'));
    document.getElementById('filterDefault').classList.add('active');
    
    updateTypeLabel();
    updateColorLabel();
    updateManufacturerLabel();
    updateCompositionLabel();
    
    if (typeFilterExpanded) updateTypeFilterList();
    if (colorFilterExpanded) updateColorFilterList();
    if (manufacturerFilterExpanded) updateManufacturerFilterList();
    if (compositionFilterExpanded) updateCompositionFilterList();
    
    if (isInGroupView) {
        exitGroupView();
    }
    
    loadFilaments();
}

// ===== ПОСТРОЕНИЕ URL =====

function buildMaterialsUrl() {
    const params = new URLSearchParams();
    
    if (currentSearchQuery) {
        params.append('name', currentSearchQuery);
    }
    
    selectedTypes.forEach(t => {
        params.append('material', t);
    });
    
    selectedColors.forEach(c => {
        params.append('color', c);
    });
    
    selectedManufacturers.forEach(m => {
        params.append('manufacturer', m);
    });
    
    if (selectedCompositions.length > 0) {
        const compositionParams = buildCompositionParams(selectedCompositions);
        for (const param of compositionParams) {
            params.append('composition', param);
        }
    }
    
    if (isGrouped) {
        params.append('grouped', 'true');
    }
    
    if (currentSortBy) {
        params.append('sort_by', currentSortBy);
        params.append('sort_order', currentSortOrder);
    }
    
    return `${API_URL}/materials/?${params.toString()}`;
}

// ===== ЗАГРУЗКА КАТУШЕК =====

async function loadFilaments() {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
        const url = buildMaterialsUrl();
        console.log('Загрузка катушек:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            redirectToLogin();
            return;
        }
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.status !== 200) {
            throw new Error(data.message || data.error || 'Ошибка загрузки');
        }
        allFilaments = data.data || [];
        renderFilaments(allFilaments);
    } catch (error) {
        console.error('Ошибка загрузки катушек:', error);
        showNotification('Ошибка загрузки катушек: ' + error.message, 'error');
        document.getElementById('filamentGrid').innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:40px;color:#ff5f5f;">
                <i class="fa-solid fa-circle-exclamation" style="font-size:48px;margin-bottom:12px;display:block;"></i>
                <p>Ошибка загрузки катушек</p>
                <p style="font-size:14px;color:#9ca3af;margin-top:8px;">Проверьте подключение к серверу</p>
            </div>
        `;
    }
}

function renderFilaments(filaments) {
    const grid = document.getElementById('filamentGrid');
    if (!grid) return;
    if (!filaments || filaments.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:#9ca3af;">
            <i class="fa-solid fa-box-open" style="font-size:48px;margin-bottom:12px;display:block;"></i>
            <p>Нет катушек. Добавьте первую!</p>
        </div>`;
        return;
    }
    
    let html = '';
    for (const f of filaments) {
        if (f.is_group === true) {
            const colorKey = f.color || '';
            const colorHex = COLOR_MAP[colorKey] || '#8b5cf6';
            const ringColor = RING_COLOR_MAP[colorKey] || '#8b5cf6';
            const colorName = COLOR_NAMES[colorKey] || f.color || 'Без цвета';
            const progress = Math.round(((f.current_length || 0) / (f.initial_length || 1)) * 100);
            const isEmpty = (f.current_length || 0) <= 0;
            const materialType = f.material_type || 'Неизвестный тип';
            const manufacturer = f.manufacturer || '';
            
            const emptyStyles = isEmpty ? `
                opacity: 0.5;
                filter: grayscale(0.8);
                border-color: rgba(255,255,255,0.02);
            ` : '';
            
            const currentLength = formatLength(f.current_length || 0);
            const initialLength = formatLength(f.initial_length || 0);
            const lengthText = isEmpty ? '0 мм (пусто)' : `${currentLength} / ${initialLength}`;
            const lengthColor = isEmpty ? '#6b7280' : colorHex;
            
            let ringStyle;
            if (colorKey === 'multicolor') {
                const multiColors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7'];
                const totalColors = multiColors.length;
                const segmentSize = 100 / totalColors;
                let gradientStops = [];
                
                for (let i = 0; i < totalColors; i++) {
                    const start = i * segmentSize;
                    const end = (i + 1) * segmentSize;
                    if (start < progress) {
                        const actualEnd = Math.min(end, progress);
                        gradientStops.push(`${multiColors[i]} ${start}% ${actualEnd}%`);
                    } else {
                        if (i === 0 && progress === 0) {
                            gradientStops = [`#2b2f3a 0% 100%`];
                            break;
                        }
                        if (i === 0 && progress > 0) {
                            continue;
                        }
                        const darkStart = Math.max(progress, start);
                        if (darkStart < 100) {
                            gradientStops.push(`#2b2f3a ${darkStart}% 100%`);
                        }
                        break;
                    }
                }
                
                if (progress >= 100) {
                    gradientStops = gradientStops.filter(stop => !stop.includes('#2b2f3a'));
                    if (gradientStops.length > 0) {
                        const last = gradientStops[gradientStops.length - 1];
                        const parts = last.split(' ');
                        if (parts.length >= 3) {
                            parts[parts.length - 1] = '100%';
                            gradientStops[gradientStops.length - 1] = parts.join(' ');
                        }
                    }
                }
                
                if (gradientStops.length === 0) {
                    gradientStops = [`#2b2f3a 0% 100%`];
                }
                
                ringStyle = `background: conic-gradient(${gradientStops.join(', ')});`;
            } else {
                ringStyle = `background: conic-gradient(${ringColor} ${progress}%, #2b2f3a 0);`;
            }
            
            const dotStyle = colorKey === 'multicolor' 
                ? 'background: linear-gradient(45deg, #ef4444, #f59e0b, #22c55e, #3b82f6, #a855f7);' 
                : `background: ${colorHex};`;
            
            const manufacturerHtml = manufacturer ? `
                <p style="font-size:11px; color:#6b7280; margin-top:1px;">
                    <i class="fa-solid fa-building" style="font-size:10px; margin-right:3px;"></i>
                    ${manufacturer}
                </p>
            ` : '';
            
            const escapedKey = f.group_key.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            
            html += `<article class="filament-card group-card" data-groupkey="${escapedKey}" style="cursor:pointer; ${emptyStyles} border:2px solid #8b5cf6;">
                <div class="card-top">
                    <div class="progress-ring" style="--progress:${progress}; ${ringStyle}">
                        <span>${isEmpty ? '0%' : progress + '%'}</span>
                    </div>
                    <div class="filament-info">
                        <h2>📦 Группа: ${f.count} шт.</h2>
                        <p class="filament-color" style="color:${isEmpty ? '#6b7280' : colorHex};">
                            <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${isEmpty ? '#6b7280' : colorHex}; margin-right:6px; vertical-align:middle;"></span>
                            ${colorName}
                        </p>
                        <p style="font-size:12px; color:#6b7280; margin-top:2px;">
                            <i class="fa-solid fa-cube" style="font-size:11px; margin-right:4px;"></i>
                            ${materialType.toUpperCase()}
                        </p>
                        ${manufacturerHtml}
                        <p style="font-size:10px; color:#4a4a5a; margin-top:1px;">
                            <i class="fa-solid fa-people-group"></i> ${f.count} катушек
                        </p>
                    </div>
                </div>
                <div class="weight-info" style="color:${lengthColor};">
                    <div class="weight-dot" style="${dotStyle}"></div>
                    <span>${lengthText} (общая)</span>
                </div>
                <div style="margin-top:6px; font-size:10px; color:#8b5cf6; text-align:center; border-top:1px solid rgba(139,92,246,0.2); padding-top:4px;">
                    <i class="fa-solid fa-chevron-down"></i> Нажмите для просмотра
                </div>
            </article>`;
            continue;
        }
        
        const colorKey = f.color || '';
        const colorHex = COLOR_MAP[colorKey] || '#8b5cf6';
        const ringColor = RING_COLOR_MAP[colorKey] || '#8b5cf6';
        const colorName = COLOR_NAMES[colorKey] || f.color || 'Без цвета';
        const progress = Math.round(((f.current_length || 0) / (f.initial_length || 1)) * 100);
        const isEmpty = (f.current_length || 0) <= 0;
        const materialType = f.material_type || 'Неизвестный тип';
        const manufacturer = f.manufacturer || '';
        const density = f.density || 1.24;
        const diameter = f.diameter || 1.75;
        
        const emptyStyles = isEmpty ? `
            opacity: 0.5;
            filter: grayscale(0.8);
            border-color: rgba(255,255,255,0.02);
        ` : '';
        
        const currentLength = formatLength(f.current_length || 0);
        const initialLength = formatLength(f.initial_length || 0);
        const lengthText = isEmpty ? '0 мм (пусто)' : `${currentLength} / ${initialLength}`;
        const lengthColor = isEmpty ? '#6b7280' : colorHex;
        
        let ringStyle;
        if (colorKey === 'multicolor') {
            const multiColors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7'];
            const totalColors = multiColors.length;
            const segmentSize = 100 / totalColors;
            let gradientStops = [];
            
            for (let i = 0; i < totalColors; i++) {
                const start = i * segmentSize;
                const end = (i + 1) * segmentSize;
                if (start < progress) {
                    const actualEnd = Math.min(end, progress);
                    gradientStops.push(`${multiColors[i]} ${start}% ${actualEnd}%`);
                } else {
                    if (i === 0 && progress === 0) {
                        gradientStops = [`#2b2f3a 0% 100%`];
                        break;
                    }
                    if (i === 0 && progress > 0) {
                        continue;
                    }
                    const darkStart = Math.max(progress, start);
                    if (darkStart < 100) {
                        gradientStops.push(`#2b2f3a ${darkStart}% 100%`);
                    }
                    break;
                }
            }
            
            if (progress >= 100) {
                gradientStops = gradientStops.filter(stop => !stop.includes('#2b2f3a'));
                if (gradientStops.length > 0) {
                    const last = gradientStops[gradientStops.length - 1];
                    const parts = last.split(' ');
                    if (parts.length >= 3) {
                        parts[parts.length - 1] = '100%';
                        gradientStops[gradientStops.length - 1] = parts.join(' ');
                    }
                }
            }
            
            if (gradientStops.length === 0) {
                gradientStops = [`#2b2f3a 0% 100%`];
            }
            
            ringStyle = `background: conic-gradient(${gradientStops.join(', ')});`;
        } else {
            ringStyle = `background: conic-gradient(${ringColor} ${progress}%, #2b2f3a 0);`;
        }
        
        const dotStyle = colorKey === 'multicolor' 
            ? 'background: linear-gradient(45deg, #ef4444, #f59e0b, #22c55e, #3b82f6, #a855f7);' 
            : `background: ${colorHex};`;
        
        const emptyEmoji = isEmpty ? ' 📦' : '';
        
        const manufacturerHtml = manufacturer ? `
            <p style="font-size:11px; color:#6b7280; margin-top:1px;">
                <i class="fa-solid fa-building" style="font-size:10px; margin-right:3px;"></i>
                ${manufacturer}
            </p>
        ` : '';
        
        const specsHtml = `
            <p style="font-size:10px; color:#4a4a5a; margin-top:1px;">
                ρ=${density} г/см³ • Ø=${diameter} мм
            </p>
        `;
        
        html += `<article class="filament-card" onclick="openDetailModal(${f.id})" style="cursor:pointer; ${emptyStyles}">
            <div class="card-top">
                <div class="progress-ring" style="--progress:${progress}; ${ringStyle}">
                    <span>${isEmpty ? '0%' : progress + '%'}</span>
                </div>
                <div class="filament-info">
                    <h2>${f.name || 'Без названия'}${emptyEmoji}</h2>
                    <p class="filament-color" style="color:${isEmpty ? '#6b7280' : colorHex};">
                        <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${isEmpty ? '#6b7280' : colorHex}; margin-right:6px; vertical-align:middle;"></span>
                        ${colorName}
                    </p>
                    <p style="font-size:12px; color:#6b7280; margin-top:2px;">
                        <i class="fa-solid fa-cube" style="font-size:11px; margin-right:4px;"></i>
                        ${materialType.toUpperCase()}
                    </p>
                    ${manufacturerHtml}
                    ${specsHtml}
                </div>
            </div>
            <div class="weight-info" style="color:${lengthColor};">
                <div class="weight-dot" style="${dotStyle}"></div>
                <span>${lengthText}</span>
            </div>
            ${isEmpty ? `<div style="margin-top:6px; font-size:11px; color:#6b7280; text-align:center; border-top:1px solid rgba(255,255,255,0.05); padding-top:6px;">
                <i class="fa-solid fa-triangle-exclamation"></i> Катушка пуста
            </div>` : ''}
        </article>`;
    }
    
    grid.innerHTML = html;
    
    document.querySelectorAll('.group-card').forEach(card => {
        card.addEventListener('click', function(e) {
            e.preventDefault();
            const groupKey = this.dataset.groupkey;
            if (groupKey) {
                openGroupView(groupKey);
            }
        });
    });
}

function loadGroupingState() {
    const saved = localStorage.getItem('filament_grouping_enabled');
    if (saved !== null) {
        return saved === 'true';
    }
    return false;
}

function saveGroupingState(value) {
    localStorage.setItem('filament_grouping_enabled', String(value));
}

// ===== НАВИГАЦИЯ ПО ГРУППАМ =====

function showBackButton(show) {
    const searchSection = document.querySelector('.search-section');
    if (!searchSection) return;
    
    let backBtn = document.getElementById('groupBackButton');
    
    if (show) {
        if (!backBtn) {
            backBtn = document.createElement('button');
            backBtn.id = 'groupBackButton';
            backBtn.className = 'filter-button';
            backBtn.style.background = '#8b5cf6';
            backBtn.style.color = '#ffffff';
            backBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i>';
            backBtn.title = 'Назад к списку';
            backBtn.onclick = exitGroupView;
            searchSection.prepend(backBtn);
        }
        backBtn.style.display = 'flex';
    } else {
        if (backBtn) {
            backBtn.style.display = 'none';
        }
    }
}

async function openGroupView(groupKey) {
    console.log('openGroupView вызвана с groupKey:', groupKey);
    
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Вы не авторизованы', 'error');
        return;
    }
    
    try {
        const encodedKey = encodeURIComponent(groupKey);
        const url = `${API_URL}/materials/?group_key=${encodedKey}`;
        console.log('Запрос URL:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Ответ от сервера статус:', response.status);
        
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            redirectToLogin();
            return;
        }
        
        if (response.status === 404) {
            showNotification('Группа не найдена', 'error');
            return;
        }
        
        if (response.status === 500) {
            showNotification('Ошибка сервера при загрузке группы', 'error');
            return;
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Данные группы:', data);
        
        if (data.status !== 200) {
            throw new Error(data.message || 'Ошибка загрузки группы');
        }
        
        const filaments = data.data || [];
        console.log('Катушки в группе:', filaments);
        
        if (filaments.length === 0) {
            showNotification('В группе нет катушек', 'error');
            return;
        }
        
        isInGroupView = true;
        currentGroupKey = groupKey;
        groupNavigationStack.push(groupKey);
        
        showBackButton(true);
        
        const logo = document.querySelector('.logo');
        if (logo) {
            const first = filaments[0];
            const colorName = COLOR_NAMES[first.color] || first.color || 'Без цвета';
            const materialType = first.material_type || 'Неизвестный тип';
            logo.textContent = `📦 Группа (${filaments.length})`;
            logo.style.fontSize = '20px';
        }
        
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.placeholder = `Поиск в группе...`;
            searchInput.value = '';
        }
        
        renderGroupFilaments(filaments);
        
    } catch (error) {
        console.error('Ошибка загрузки группы:', error);
        showNotification('Ошибка загрузки группы: ' + error.message, 'error');
    }
}

function renderGroupFilaments(filaments) {
    const grid = document.getElementById('filamentGrid');
    if (!grid) return;
    
    if (!filaments || filaments.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:#9ca3af;">
            <i class="fa-solid fa-box-open" style="font-size:48px;margin-bottom:12px;display:block;"></i>
            <p>В группе нет катушек</p>
        </div>`;
        return;
    }
    
    const sortedFilaments = [...filaments].sort((a, b) => {
        const nameA = a.name || '';
        const nameB = b.name || '';
        return nameA.localeCompare(nameB);
    });
    
    let html = '';
    for (const f of sortedFilaments) {
        const colorKey = f.color || '';
        const colorHex = COLOR_MAP[colorKey] || '#8b5cf6';
        const ringColor = RING_COLOR_MAP[colorKey] || '#8b5cf6';
        const colorName = COLOR_NAMES[colorKey] || f.color || 'Без цвета';
        const progress = Math.round(((f.current_length || 0) / (f.initial_length || 1)) * 100);
        const isEmpty = (f.current_length || 0) <= 0;
        const materialType = f.material_type || 'Неизвестный тип';
        const manufacturer = f.manufacturer || '';
        const density = f.density || 1.24;
        const diameter = f.diameter || 1.75;
        
        const emptyStyles = isEmpty ? `
            opacity: 0.5;
            filter: grayscale(0.8);
            border-color: rgba(255,255,255,0.02);
        ` : '';
        
        const currentLength = formatLength(f.current_length || 0);
        const initialLength = formatLength(f.initial_length || 0);
        const lengthText = isEmpty ? '0 мм (пусто)' : `${currentLength} / ${initialLength}`;
        const lengthColor = isEmpty ? '#6b7280' : colorHex;
        
        let ringStyle;
        if (colorKey === 'multicolor') {
            const multiColors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7'];
            const totalColors = multiColors.length;
            const segmentSize = 100 / totalColors;
            let gradientStops = [];
            
            for (let i = 0; i < totalColors; i++) {
                const start = i * segmentSize;
                const end = (i + 1) * segmentSize;
                if (start < progress) {
                    const actualEnd = Math.min(end, progress);
                    gradientStops.push(`${multiColors[i]} ${start}% ${actualEnd}%`);
                } else {
                    if (i === 0 && progress === 0) {
                        gradientStops = [`#2b2f3a 0% 100%`];
                        break;
                    }
                    if (i === 0 && progress > 0) {
                        continue;
                    }
                    const darkStart = Math.max(progress, start);
                    if (darkStart < 100) {
                        gradientStops.push(`#2b2f3a ${darkStart}% 100%`);
                    }
                    break;
                }
            }
            
            if (progress >= 100) {
                gradientStops = gradientStops.filter(stop => !stop.includes('#2b2f3a'));
                if (gradientStops.length > 0) {
                    const last = gradientStops[gradientStops.length - 1];
                    const parts = last.split(' ');
                    if (parts.length >= 3) {
                        parts[parts.length - 1] = '100%';
                        gradientStops[gradientStops.length - 1] = parts.join(' ');
                    }
                }
            }
            
            if (gradientStops.length === 0) {
                gradientStops = [`#2b2f3a 0% 100%`];
            }
            
            ringStyle = `background: conic-gradient(${gradientStops.join(', ')});`;
        } else {
            ringStyle = `background: conic-gradient(${ringColor} ${progress}%, #2b2f3a 0);`;
        }
        
        const dotStyle = colorKey === 'multicolor' 
            ? 'background: linear-gradient(45deg, #ef4444, #f59e0b, #22c55e, #3b82f6, #a855f7);' 
            : `background: ${colorHex};`;
        
        const emptyEmoji = isEmpty ? ' 📦' : '';
        
        const manufacturerHtml = manufacturer ? `
            <p style="font-size:11px; color:#6b7280; margin-top:1px;">
                <i class="fa-solid fa-building" style="font-size:10px; margin-right:3px;"></i>
                ${manufacturer}
            </p>
        ` : '';
        
        const specsHtml = `
            <p style="font-size:10px; color:#4a4a5a; margin-top:1px;">
                ρ=${density} г/см³ • Ø=${diameter} мм
            </p>
        `;
        
        html += `<article class="filament-card" onclick="openDetailModal(${f.id})" style="cursor:pointer; ${emptyStyles} border:2px solid ${colorHex};">
            <div class="card-top">
                <div class="progress-ring" style="--progress:${progress}; ${ringStyle}">
                    <span>${isEmpty ? '0%' : progress + '%'}</span>
                </div>
                <div class="filament-info">
                    <h2>${f.name || 'Без названия'}${emptyEmoji}</h2>
                    <p class="filament-color" style="color:${isEmpty ? '#6b7280' : colorHex};">
                        <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${isEmpty ? '#6b7280' : colorHex}; margin-right:6px; vertical-align:middle;"></span>
                        ${colorName}
                    </p>
                    <p style="font-size:12px; color:#6b7280; margin-top:2px;">
                        <i class="fa-solid fa-cube" style="font-size:11px; margin-right:4px;"></i>
                        ${materialType.toUpperCase()}
                    </p>
                    ${manufacturerHtml}
                    ${specsHtml}
                </div>
            </div>
            <div class="weight-info" style="color:${lengthColor};">
                <div class="weight-dot" style="${dotStyle}"></div>
                <span>${lengthText}</span>
            </div>
            ${isEmpty ? `<div style="margin-top:6px; font-size:11px; color:#6b7280; text-align:center; border-top:1px solid rgba(255,255,255,0.05); padding-top:6px;">
                <i class="fa-solid fa-triangle-exclamation"></i> Катушка пуста
            </div>` : ''}
        </article>`;
    }
    
    grid.innerHTML = html;
}

function exitGroupView() {
    isInGroupView = false;
    currentGroupKey = null;
    groupNavigationStack = [];
    
    showBackButton(false);
    
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.textContent = 'Катушки';
        logo.style.fontSize = '';
    }
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.placeholder = 'Поиск филамента...';
        searchInput.value = '';
    }
    
    loadFilaments();
}

// ===== ДЕТАЛИ КАТУШКИ =====

async function openDetailModal(id) {
    currentFilamentId = id;
    
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Вы не авторизованы', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/materials/by_id/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            redirectToLogin();
            return;
        }
        
        if (response.status === 404) {
            showNotification('Катушка не найдена', 'error');
            return;
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.status !== 200) {
            throw new Error(data.message || 'Ошибка загрузки катушки');
        }
        
        const filament = data.data;
        if (!filament) {
            showNotification('Катушка не найдена', 'error');
            return;
        }
        
        const modal = document.getElementById('detailModal');
        const body = document.getElementById('detailBody');
        
        const colorKey = filament.color || '';
        const colorHex = COLOR_MAP[colorKey] || '#8b5cf6';
        const ringColor = RING_COLOR_MAP[colorKey] || '#8b5cf6';
        const colorName = COLOR_NAMES[colorKey] || filament.color || 'Без цвета';
        const progress = Math.round(((filament.current_length || 0) / (filament.initial_length || 1)) * 100);
        const used = (filament.initial_length || 0) - (filament.current_length || 0);
        const isEmpty = (filament.current_length || 0) <= 0;
        
        const currentLength = formatLength(filament.current_length || 0);
        const initialLength = formatLength(filament.initial_length || 0);
        const usedLength = formatLength(used);
        const manufacturer = filament.manufacturer || '';
        const density = filament.density || 1.24;
        const diameter = filament.diameter || 1.75;
        
        let ringStyle;
        if (colorKey === 'multicolor') {
            const colors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7'];
            const totalColors = colors.length;
            const segmentSize = 100 / totalColors;
            let gradientStops = [];
            
            for (let i = 0; i < totalColors; i++) {
                const start = i * segmentSize;
                const end = (i + 1) * segmentSize;
                if (start < progress) {
                    const actualEnd = Math.min(end, progress);
                    gradientStops.push(`${colors[i]} ${start}% ${actualEnd}%`);
                }
            }
            
            if (progress < 100) {
                gradientStops.push(`#2b2f3a ${progress}% 100%`);
            }
            
            ringStyle = `background: conic-gradient(${gradientStops.join(', ')});`;
        } else {
            ringStyle = `--ring-color:${ringColor}; background: conic-gradient(var(--ring-color) ${progress}%, #2b2f3a 0);`;
        }
        
        const historyHtml = await loadConsumptionHistory(id);
        
        const emptyEmoji = isEmpty ? ' 📦' : '';
        
        const hasComposition = filament.composition && Array.isArray(filament.composition) && filament.composition.length > 0;
        
        body.innerHTML = `
            <div style="display:flex; gap:20px; flex-wrap:wrap; align-items:flex-start; ${isEmpty ? 'opacity:0.6;' : ''}">
                <div style="flex:1; min-width:200px;">
                    <div style="display:flex; align-items:center; gap:16px; margin-bottom:16px;">
                        <div class="progress-ring" style="--size:80px; width:80px; height:80px; min-width:80px; --progress:${progress}; ${ringStyle}">
                            <span style="font-size:16px;">${isEmpty ? '0%' : progress + '%'}</span>
                        </div>
                        <div>
                            <h2 style="color:#ffffff; font-size:22px; margin-bottom:4px;">${filament.name}${emptyEmoji}</h2>
                            <p style="color:${isEmpty ? '#6b7280' : colorHex}; font-size:16px; font-weight:600;">${colorName} ${filament.material_type ? '• ' + filament.material_type.toUpperCase() : ''}</p>
                            ${manufacturer ? `<p style="color:#9ca3af; font-size:14px;"><i class="fa-solid fa-building"></i> ${manufacturer}</p>` : ''}
                            <p style="color:#9ca3af; font-size:13px;">Плотность: ${density} г/см³ • Диаметр: ${diameter} мм</p>
                            ${isEmpty ? `<p style="color:#ff5f5f; font-size:14px; margin-top:4px;"><i class="fa-solid fa-triangle-exclamation"></i> Катушка пуста</p>` : ''}
                        </div>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:16px;">
                        <div style="background:#232734; border-radius:10px; padding:12px; text-align:center;">
                            <div style="font-size:12px; color:#9ca3af;">Начальная длина</div>
                            <div style="font-size:20px; font-weight:700; color:#ffffff;">${initialLength}</div>
                        </div>
                        <div style="background:#232734; border-radius:10px; padding:12px; text-align:center;">
                            <div style="font-size:12px; color:#9ca3af;">Текущая длина</div>
                            <div style="font-size:20px; font-weight:700; color:${isEmpty ? '#6b7280' : '#ffffff'};">${currentLength}</div>
                        </div>
                        <div style="background:#232734; border-radius:10px; padding:12px; text-align:center;">
                            <div style="font-size:12px; color:#9ca3af;">Использовано</div>
                            <div style="font-size:20px; font-weight:700; color:#ff5f5f;">${usedLength}</div>
                        </div>
                        <div style="background:#232734; border-radius:10px; padding:12px; text-align:center;">
                            <div style="font-size:12px; color:#9ca3af;">ID</div>
                            <div style="font-size:16px; font-weight:700; color:#ffffff;">#${filament.id}</div>
                        </div>
                    </div>
                </div>
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-width:160px; background:#232734; border-radius:16px; padding:16px;">
                    <div style="position:relative; display:inline-block;">
                        <div id="qrCodeContainer" style="width:140px; height:140px; border-radius:8px; background:#1a1d26; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.06);">
                            <div style="color:#6b7280; font-size:12px; text-align:center;">
                                <i class="fa-solid fa-spinner fa-spin" style="font-size:24px; display:block; margin-bottom:8px;"></i>
                                Загрузка QR-кода...
                            </div>
                        </div>
                        <button onclick="downloadQRCode()" title="Скачать QR-код" style="position:absolute; bottom:4px; right:4px; width:32px; height:32px; border:none; border-radius:50%; background:#8b5cf6; color:white; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; box-shadow:0 2px 8px rgba(0,0,0,0.3);">
                            <i class="fa-solid fa-download"></i>
                        </button>
                    </div>
                    <div style="font-size:11px; color:#9ca3af; margin-top:8px; text-align:center; word-break:break-all; max-width:140px;">ID: #${filament.id}</div>
                    <div style="display:flex; gap:8px; margin-top:12px; width:100%;">
                        <button onclick="printQRCode()" style="flex:1; background:#f59e0b; color:white; border:none; border-radius:12px; padding:10px; font-size:14px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;">
                            <i class="fa-solid fa-print"></i> QR
                        </button>
                        <button onclick="deleteFilament(${filament.id})" style="flex:1; background:#ff5f5f; color:white; border:none; border-radius:12px; padding:10px; font-size:14px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;">
                            <i class="fa-solid fa-trash"></i> Удалить
                        </button>
                    </div>
                </div>
            </div>
            
            <div style="margin-top:16px; background:#232734; border-radius:10px; padding:12px;">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
                    <i class="fa-solid fa-flask" style="color:#9ca3af; font-size:14px;"></i>
                    <span style="font-size:13px; font-weight:600; color:#9ca3af;">СОСТАВ</span>
                </div>
                ${hasComposition ? `
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        ${filament.composition.map(item => `
                            <div style="display:flex; justify-content:space-between; align-items:center; padding:4px 8px; background:#1a1d26; border-radius:6px;">
                                <span style="color:#ffffff; font-size:13px;">${item.material || 'Неизвестный материал'}</span>
                                <span style="color:#8b5cf6; font-weight:600; font-size:13px;">${item.percent || 0}%</span>
                            </div>
                        `).join('')}
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 8px 2px 8px; border-top:2px solid rgba(139,92,246,0.3); margin-top:2px;">
                            <span style="color:#9ca3af; font-size:12px; font-weight:500;">Итого</span>
                            <span style="color:#4ade80; font-weight:700; font-size:13px;">${filament.composition.reduce((sum, item) => sum + (item.percent || 0), 0)}%</span>
                        </div>
                    </div>
                ` : `
                    <div style="text-align:center; padding:8px; color:#6b7280; font-size:13px;">
                        <i class="fa-solid fa-circle-info" style="margin-right:6px;"></i>
                        Состав не указан
                    </div>
                `}
            </div>
            
            <div style="margin-top:12px; background:#232734; border-radius:10px; padding:12px;">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
                    <i class="fa-solid fa-clock-rotate-left" style="color:#9ca3af; font-size:14px;"></i>
                    <span style="font-size:13px; font-weight:600; color:#9ca3af;">ИСТОРИЯ РАСХОДА</span>
                </div>
                ${historyHtml}
            </div>
        `;
        modal.style.display = 'flex';
        
        loadQRCode(filament.id);
        
    } catch (error) {
        console.error('Ошибка загрузки катушки:', error);
        showNotification('Ошибка загрузки катушки: ' + error.message, 'error');
    }
}

// ===== QR-КОД =====

function printQRCode() {
    if (window.api?.printQR) {
        window.api.printQR(currentFilamentId);
        return;
    }
	
	if (window.Android) {
		window.Android.printQR(currentFilamentId);
		return;
	}   

    const container = document.getElementById('qrCodeContainer');
    if (!container) {
        showNotification('QR-код не найден', 'error');
        return;
    }

    const img = container.querySelector('img');
    if (!img) {
        showNotification('QR-код еще не загружен', 'error');
        return;
    }

    const printContainer = document.createElement('div');
    printContainer.id = 'printQRContainer';
    printContainer.style.cssText = `
        position: fixed;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;
        z-index: 9999;
        padding: 20px;
    `;
    printContainer.innerHTML = `
        <div style="
            display:flex;
            align-items:center;
            justify-content:center;
            width:100%;
            height:100%;
        ">
            <img
                src="${img.src}"
                alt="QR-код"
                style="
                    width:100%;
                    max-width:800px;
                    height:auto;
                    max-height:90vh;
                    display:block;
                    object-fit:contain;
                    background:white;
                "
            />
        </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
        @page {
            margin: 0;
            size: A4 portrait;
        }
        @media print {
            html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background: white !important;
            }
            body * {
                visibility: hidden !important;
            }
            #printQRContainer,
            #printQRContainer * {
                visibility: visible !important;
            }
            #printQRContainer {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                height: 100% !important;
                margin: 0 !important;
                padding: 20px !important;
                background: white !important;
                z-index: 9999 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            }
            #printQRContainer img {
                width: 100% !important;
                max-width: 800px !important;
                height: auto !important;
                max-height: 90vh !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
        }
    `;
    printContainer.appendChild(style);
    document.body.appendChild(printContainer);

    setTimeout(() => {
        window.print();
        setTimeout(() => {
            document.getElementById('printQRContainer')?.remove();
        }, 1000);
    }, 300);
}

async function loadQRCode(materialId) {
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Вы не авторизованы', 'error');
        return;
    }
    
    const container = document.getElementById('qrCodeContainer');
    if (!container) return;
    
    try {
        const response = await fetch(`${API_URL}/materials/qr/${materialId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            redirectToLogin();
            return;
        }
        
        if (response.status === 404) {
            container.innerHTML = `
                <div style="color:#6b7280; font-size:12px; text-align:center;">
                    <i class="fa-solid fa-circle-xmark" style="font-size:24px; display:block; margin-bottom:8px;"></i>
                    QR-код не найден
                </div>
            `;
            return;
        }
        
        if (!response.ok) {
            throw new Error('Ошибка загрузки QR-кода');
        }
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        container.innerHTML = `
            <img src="${url}" alt="QR-код" style="width:140px; height:140px; border-radius:8px; background:white; padding:8px;" />
        `;
        
        container.dataset.qrUrl = url;
        
    } catch (error) {
        console.error('Ошибка загрузки QR-кода:', error);
        container.innerHTML = `
            <div style="color:#ff5f5f; font-size:12px; text-align:center;">
                <i class="fa-solid fa-circle-exclamation" style="font-size:24px; display:block; margin-bottom:8px;"></i>
                Ошибка загрузки
            </div>
        `;
    }
}

function downloadQRCode() {
    const container = document.getElementById('qrCodeContainer');
    if (!container) {
        showNotification('QR-код не найден', 'error');
        return;
    }

    const img = container.querySelector('img');
    if (!img) {
        showNotification('QR-код еще не загружен', 'error');
        return;
    }
    
    const imgUrl = img.src;
    const token = localStorage.getItem('token');
    
    fetch(imgUrl, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка загрузки QR-кода');
        }
        return response.blob();
    })
    .then(blob => {
        const link = document.createElement('a');
        link.download = `qr-code-${currentFilamentId || 'filament'}.svg`;
        link.href = URL.createObjectURL(blob);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => {
            URL.revokeObjectURL(link.href);
        }, 1000);
    })
    .catch(error => {
        console.error('Ошибка скачивания QR-кода:', error);
        showNotification('Ошибка скачивания QR-кода', 'error');
    });
}

function closeDetailModal() {
    document.getElementById('detailModal').style.display = 'none';
    currentFilamentId = null;
}

document.getElementById('detailModal').addEventListener('click', function(e) {
    if (e.target === this) closeDetailModal();
});

async function loadConsumptionHistory(materialId) {
    const token = localStorage.getItem('token');
    if (!token) return `<div style="text-align:center;padding:8px 0;color:#9ca3af;font-size:13px;">Авторизуйтесь для просмотра истории</div>`;
    try {
        const response = await fetch(`${API_URL}/consumptions/by_material/${materialId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            redirectToLogin();
            return `<div style="text-align:center;padding:8px 0;color:#ff5f5f;font-size:13px;">Сессия истекла</div>`;
        }
        if (response.status === 404) {
            return `<div style="text-align:center;padding:8px 0;color:#9ca3af;font-size:13px;">
                <i class="fa-solid fa-inbox" style="display:block;font-size:18px;margin-bottom:4px;opacity:0.5;"></i>
                Пока что расходов по этой катушке не было
            </div>`;
        }
        const data = await response.json();
        if (data.status !== 200) {
            throw new Error(data.message || data.error || 'Ошибка загрузки истории');
        }
        const history = data.data || [];
        if (history.length === 0) {
            return `<div style="text-align:center;padding:8px 0;color:#9ca3af;font-size:13px;">
                <i class="fa-solid fa-inbox" style="display:block;font-size:18px;margin-bottom:4px;opacity:0.5;"></i>
                Пока что расходов по этой катушке не было
            </div>`;
        }
        
        const statusMap = {
            'success': { color: '#4ade80', label: 'Успешно' },
            'waste': { color: '#ef4444', label: 'Брак' },
            'interrupted': { color: '#f59e0b', label: 'Прервано' }
        };
        
        return `<div style="display:flex;flex-direction:column;gap:6px;max-height:150px;overflow-y:auto;padding-right:4px;">
            ${history.map(item => {
                const localTime = item.timestamp ? formatLocalDate(item.timestamp) : '';
                const remainLength = formatLength(item.remain_length || 0);
                const usedLength = formatLength(item.used_length || 0);
                const status = item.status || 'success';
                const statusDisplay = statusMap[status] || statusMap['success'];
                const shortTitle = item.title && item.title.length > 20 ? item.title.substring(0, 20) + '...' : (item.title || 'Без названия');
                
                return `
                <div style="display:flex;flex-direction:column;padding:8px 12px;background:#1a1d26;border-radius:8px;border-left:3px solid ${statusDisplay.color};gap:4px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:4px;">
                        <span style="color:#ffffff;font-size:13px;font-weight:500;word-break:break-word;">${shortTitle}</span>
                        <span style="background:${statusDisplay.color}; color:${status === 'success' ? '#1a1d26' : 'white'}; font-size:9px; padding:1px 8px; border-radius:3px; white-space:nowrap; flex-shrink:0;">${statusDisplay.label}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:4px;">
                        <span style="color:#6b7280;font-size:10px;">
                            <i class="fa-regular fa-calendar"></i> ${localTime}
                        </span>
                        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                            <span style="font-size:11px;color:#9ca3af;">Остаток: ${remainLength}</span>
                            <span style="font-size:13px;font-weight:700;color:#ff5f5f;">-${usedLength}</span>
                        </div>
                    </div>
                </div>
            `}).join('')}
        </div>`;
    } catch (error) {
        console.error('Ошибка загрузки истории:', error);
        return `<div style="text-align:center;padding:8px 0;color:#ff5f5f;font-size:13px;">Ошибка загрузки истории</div>`;
    }
}

async function deleteFilament(id) {
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Вы не авторизованы', 'error');
        return;
    }
    try {
        const response = await fetch(`${API_URL}/materials/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            redirectToLogin();
            return;
        }
        if (response.status === 204) {
            showNotification('Катушка удалена', 'success');
            closeDetailModal();
            loadFilaments();
            return;
        }
        if (response.status === 200) {
            const data = await response.json();
            if (data.status === 200 || data.status === 204) {
                showNotification('Катушка удалена', 'success');
                closeDetailModal();
                loadFilaments();
                return;
            }
        }
        const data = await response.json();
        if (data.status !== 204 && data.status !== 200) {
            throw new Error(data.message || data.error || 'Ошибка удаления');
        }
        showNotification('Катушка удалена', 'success');
        closeDetailModal();
        loadFilaments();
    } catch (error) {
        showNotification('Ошибка: ' + error.message, 'error');
    }
}

// ===== ДОБАВЛЕНИЕ КАТУШКИ =====

function checkFilamentFields() {
    const name = document.getElementById('filamentName').value.trim();
    const material_type = document.getElementById('filamentType').value.trim();
    const color = document.getElementById('filamentColor').value.trim();
    const length = parseFloat(document.getElementById('filamentLength').value);
    const button = document.getElementById('addFilamentBtn');
    if (name && material_type && color && length > 0 && length <= MAX_FILAMENT_LENGTH) {
        button.disabled = false;
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
    } else {
        button.disabled = true;
        button.style.opacity = '0.5';
        button.style.cursor = 'not-allowed';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    ['filamentName', 'filamentManufacturer', 'filamentType', 'filamentColor', 'filamentLength'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', checkFilamentFields);
            el.addEventListener('change', checkFilamentFields);
        }
    });
    
    const typeSelect = document.getElementById('filamentType');
    if (typeSelect) {
        typeSelect.addEventListener('change', function() {
            // Если пользователь сам меняет тип, не перезаписываем его автоматически
            // Просто обновляем расширенные настройки
            updateAdvancedDefaults();
            // Проверяем, нужно ли синхронизировать состав
            syncCompositionWithType();
        });
    }
});

function openAddFilament() {
    document.getElementById('addFilamentModal').style.display = 'flex';
    document.getElementById('filamentName').value = '';
    document.getElementById('filamentManufacturer').value = '';
    document.getElementById('filamentType').value = '';
    document.getElementById('filamentColor').value = '';
    document.getElementById('filamentLength').value = '300000';
    document.getElementById('filamentDensity').value = '1.24';
    document.getElementById('filamentDiameter').value = '1.75';
    document.getElementById('advancedSettings').style.display = 'none';
    document.getElementById('advancedIcon').className = 'fa-solid fa-gear';
    
    const defaultType = document.getElementById('filamentType').value || 'pla';
    compositionData = [{ material: defaultType.toLowerCase(), percent: 100 }];
    renderCompositionList();
    updateCompositionTotal();
    
    ['filamentName', 'filamentManufacturer', 'filamentType', 'filamentColor', 'filamentLength'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.borderColor = '';
    });
    checkFilamentFields();
}

function closeAddFilament() {
    document.getElementById('addFilamentModal').style.display = 'none';
}

document.getElementById('addFilamentModal').addEventListener('click', function(e) {
    if (e.target === this) closeAddFilament();
});

function setColor(color) {
    const map = {
        'green': 'green', 'yellow': 'yellow', 'red': 'red', 'blue': 'blue',
        'orange': 'orange', 'purple': 'purple', 'black': 'black', 'white': 'white',
        'gray': 'gray', 'silver': 'silver', 'crimson': 'crimson', 'pink': 'pink',
        'gold': 'gold', 'lime': 'lime', 'teal': 'teal', 'cyan': 'cyan',
        'navy': 'navy', 'violet': 'violet', 'magenta': 'magenta', 'brown': 'brown',
        'beige': 'beige', 'transparent': 'transparent', 'glow': 'glow', 'multicolor': 'multicolor'
    };
    document.getElementById('filamentColor').value = map[color] || color;
    checkFilamentFields();
}

async function addFilamentManual() {
    const name = document.getElementById('filamentName').value.trim();
    const manufacturer = document.getElementById('filamentManufacturer').value.trim();
    const material_type = document.getElementById('filamentType').value.trim();
    const color = document.getElementById('filamentColor').value.trim();
    const initial_length = parseFloat(document.getElementById('filamentLength').value);
    
    let density = parseFloat(document.getElementById('filamentDensity').value) || 1.24;
    let diameter = parseFloat(document.getElementById('filamentDiameter').value) || 1.75;
    
    if (!name || !material_type || !color || !initial_length || initial_length < 1) {
        showNotification('Заполните все поля корректно', 'error');
        return;
    }
    if (initial_length > MAX_FILAMENT_LENGTH) {
        showNotification(`Максимальная длина катушки: 100 км (${MAX_FILAMENT_LENGTH} мм)`, 'error');
        return;
    }
    if (density < 0.1 || density > 10) {
        showNotification('Плотность должна быть от 0.1 до 10 г/см³', 'error');
        return;
    }
    if (diameter < 0.5 || diameter > 5) {
        showNotification('Диаметр должен быть от 0.5 до 5 мм', 'error');
        return;
    }
    
    const total = compositionData.reduce((sum, item) => sum + (item.percent || 0), 0);
    if (Math.abs(total - 100) > 0.01) {
        showNotification('Сумма компонентов состава должна быть 100%', 'error');
        return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Вы не авторизованы', 'error');
        return;
    }
    try {
        const requestBody = { 
            name: name, 
            material_type: material_type,
            color: color, 
            initial_length: initial_length,
            density: density,
            diameter: diameter,
            composition: compositionData
        };
        
        if (manufacturer) {
            requestBody.manufacturer = manufacturer;
        }
        
        console.log('Отправка данных:', requestBody);
        
        const response = await fetch(`${API_URL}/materials/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestBody)
        });
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            redirectToLogin();
            return;
        }
        const data = await response.json();
        if (data.status !== 201) {
            throw new Error(data.message || data.error || 'Ошибка добавления');
        }
        showNotification('Катушка успешно добавлена!', 'success');
        closeAddFilament();
        await loadUniqueValues();
        await loadFilaments();
    } catch (error) {
        showNotification('Ошибка: ' + error.message, 'error');
    }
}

// ===== QR-СКАНЕР =====

let html5QrCode = null;
let isScannerRunning = false;
let currentScanMethod = 'camera';

function switchScanMethod(method) {
    currentScanMethod = method;
    const cameraBtn = document.getElementById('scanCameraBtn');
    const fileBtn = document.getElementById('scanFileBtn');
    const cameraArea = document.getElementById('qrCameraArea');
    const fileArea = document.getElementById('qrFileArea');
    
    if (method === 'camera') {
        cameraBtn.style.background = '#3b82f6';
        fileBtn.style.background = '#8b5cf6';
        cameraArea.style.display = 'block';
        fileArea.style.display = 'none';
        if (!isScannerRunning) {
            const resultsDiv = document.getElementById('qr-reader-results');
            resultsDiv.textContent = 'Нажмите "Запустить камеру" для начала сканирования';
            resultsDiv.style.color = '#9ca3af';
        }
    } else {
        fileBtn.style.background = '#3b82f6';
        cameraBtn.style.background = '#8b5cf6';
        cameraArea.style.display = 'none';
        fileArea.style.display = 'flex';
        if (isScannerRunning) {
            stopQRScanner();
        }
        document.getElementById('qrFileResult').textContent = 'Выберите изображение с QR-кодом';
        document.getElementById('qrFileResult').style.color = '#9ca3af';
    }
}

function openQRScanner() {
    const modal = document.getElementById('qrScannerModal');
    modal.style.display = 'flex';
    clearQRScanner();
    switchScanMethod('camera');
}

function closeQRScanner() {
    stopQRScanner();
    document.getElementById('qrScannerModal').style.display = 'none';
    clearQRScanner();
}

function clearQRScanner() {
    const resultsDiv = document.getElementById('qr-reader-results');
    if (resultsDiv) {
        resultsDiv.textContent = 'Нажмите кнопку для запуска сканирования';
        resultsDiv.style.color = '#9ca3af';
        resultsDiv.innerHTML = '';
    }
    
    const fileResult = document.getElementById('qrFileResult');
    if (fileResult) {
        fileResult.textContent = 'Выберите изображение с QR-кодом';
        fileResult.style.color = '#9ca3af';
        fileResult.innerHTML = '';
    }
    
    const fileInput = document.getElementById('qrFileInput');
    if (fileInput) {
        fileInput.value = '';
    }
    
    const readerElement = document.getElementById('qr-reader');
    if (readerElement) {
        readerElement.innerHTML = '';
    }
    
    const toggleBtn = document.getElementById('qrScannerToggleBtn');
    if (toggleBtn) {
        toggleBtn.innerHTML = '<i class="fa-solid fa-play"></i> Запустить камеру';
        toggleBtn.style.background = '#8b5cf6';
    }
    
    isScannerRunning = false;
    
    if (html5QrCode) {
        try {
            html5QrCode.clear();
        } catch (e) {}
        html5QrCode = null;
    }
}

document.getElementById('qrScannerModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeQRScanner();
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('qrScannerModal');
        if (modal && modal.style.display === 'flex') {
            closeQRScanner();
        }
    }
});

function toggleQRScanner() {
    if (currentScanMethod === 'camera') {
        if (isScannerRunning) {
            stopQRScanner();
        } else {
            startQRScanner();
        }
    } else {
        document.getElementById('qrFileInput').click();
    }
}

async function startQRScanner() {
    if (window.Android?.scanQR) {
        window.Android.scanQR();
        return;
    }
    const resultsDiv = document.getElementById('qr-reader-results');
    const toggleBtn = document.getElementById('qrScannerToggleBtn');
    
    if (isScannerRunning) {
        resultsDiv.textContent = 'Сканер уже запущен';
        return;
    }
    
    const readerElement = document.getElementById('qr-reader');
    readerElement.innerHTML = '';
    
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            resultsDiv.innerHTML = `
                <div style="color:#f59e0b; padding:8px;">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    Камера недоступна. Используйте загрузку файла.
                </div>
            `;
            return;
        }
        
        resultsDiv.textContent = 'Запрос доступа к камере...';
        resultsDiv.style.color = '#9ca3af';
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
        } catch (permError) {
            if (permError.name === 'NotAllowedError' || permError.name === 'PermissionDeniedError') {
                resultsDiv.innerHTML = `
                    <div style="color:#f59e0b; padding:8px;">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        Доступ к камере запрещен. Используйте загрузку файла.
                    </div>
                `;
                return;
            }
            throw permError;
        }
        
        html5QrCode = new Html5Qrcode("qr-reader");
        
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        };
        
        isScannerRunning = true;
        
        toggleBtn.innerHTML = '<i class="fa-solid fa-stop"></i> Остановить сканирование';
        toggleBtn.style.background = '#ef4444';
        
        resultsDiv.textContent = 'Сканирование... Наведите на QR-код';
        resultsDiv.style.color = '#4ade80';
        
        await html5QrCode.start(
            { facingMode: "environment" },
            config,
            onScanSuccess,
            onScanError
        );
        
    } catch (error) {
        console.error('Ошибка запуска сканера:', error);
        resultsDiv.innerHTML = `
            <div style="color:#ff5f5f; padding:8px;">
                <i class="fa-solid fa-circle-exclamation"></i>
                Ошибка: ${error.message || 'Неизвестная ошибка'}
            </div>
        `;
        isScannerRunning = false;
        toggleBtn.innerHTML = '<i class="fa-solid fa-play"></i> Запустить камеру';
        toggleBtn.style.background = '#8b5cf6';
    }
}

async function scanQRFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const resultDiv = document.getElementById('qrFileResult');
    resultDiv.textContent = 'Обработка изображения...';
    resultDiv.style.color = '#9ca3af';
    resultDiv.innerHTML = '';
    
    try {
        if (file.size > 10 * 1024 * 1024) {
            resultDiv.innerHTML = '<span style="color:#ff5f5f;">Файл слишком большой (макс 10 МБ)</span>';
            return;
        }
        
        if (!file.type.startsWith('image/')) {
            resultDiv.innerHTML = '<span style="color:#ff5f5f;">Пожалуйста, выберите изображение</span>';
            return;
        }
        
        const readerElement = document.getElementById('qr-reader');
        readerElement.innerHTML = '';
        
        const fileScanner = new Html5Qrcode("qr-reader");
        const result = await fileScanner.scanFile(file, true);
        
        if (result) {
            resultDiv.textContent = 'QR-код успешно распознан!';
            resultDiv.style.color = '#4ade80';
            try {
                fileScanner.clear();
            } catch (e) {}
            onScanSuccess(result);
        } else {
            resultDiv.innerHTML = '<span style="color:#f59e0b;">QR-код не найден на изображении</span>';
        }
        
    } catch (error) {
        console.error('Ошибка сканирования файла:', error);
        if (error.message && error.message.includes('No QR code found')) {
            resultDiv.innerHTML = '<span style="color:#f59e0b;">QR-код не найден на изображении. Попробуйте другое фото.</span>';
        } else {
            resultDiv.innerHTML = `<span style="color:#ff5f5f;">Ошибка: ${error.message || 'Неизвестная ошибка'}</span>`;
        }
    }
}

function onScanSuccess(decodedText, decodedResult) {
    if (isScannerRunning) {
        stopQRScanner();
    }
    
    const resultsDiv = document.getElementById('qr-reader-results');
    if (resultsDiv) {
        resultsDiv.textContent = 'QR-код успешно распознан!';
        resultsDiv.style.color = '#4ade80';
    }
    
    const fileResult = document.getElementById('qrFileResult');
    if (fileResult) {
        fileResult.textContent = 'QR-код успешно распознан!';
        fileResult.style.color = '#4ade80';
    }
    
    if (decodedText && decodedText.trim().length > 0) {
        findFilamentByQRCode(decodedText.trim());
    } else {
        showNotification('Не удалось распознать QR-код', 'error');
        setTimeout(() => {
            clearQRScanner();
        }, 2000);
    }
}

async function findFilamentByQRCode(qrCode) {
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Вы не авторизованы', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/materials/by_qrcode/${encodeURIComponent(qrCode)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            redirectToLogin();
            return;
        }
        
        if (response.status === 403) {
            showNotification('Доступ к этой катушке запрещен', 'error');
            setTimeout(() => {
                clearQRScanner();
            }, 2000);
            return;
        }
        
        if (response.status === 404) {
            showNotification('Катушка не найдена по QR-коду', 'error');
            setTimeout(() => {
                clearQRScanner();
            }, 2000);
            return;
        }
        
        const data = await response.json();
        if (data.status !== 200) {
            throw new Error(data.message || 'Ошибка поиска катушки');
        }
        
        const filament = data.data;
        if (filament) {
            showNotification(`Найдена катушка: ${filament.name}`, 'success');
            setTimeout(() => {
                closeQRScanner();
                openDetailModal(filament.id);
            }, 800);
        } else {
            showNotification('Катушка не найдена', 'error');
            setTimeout(() => {
                clearQRScanner();
            }, 2000);
        }
    } catch (error) {
        console.error('Ошибка поиска по QR-коду:', error);
        showNotification('Ошибка: ' + error.message, 'error');
        setTimeout(() => {
            clearQRScanner();
        }, 2000);
    }
}

function onScanError(error) {
}

function stopQRScanner() {
    const toggleBtn = document.getElementById('qrScannerToggleBtn');
    
    if (html5QrCode && isScannerRunning) {
        try {
            html5QrCode.stop().then(() => {
                html5QrCode.clear();
                isScannerRunning = false;
                const resultsDiv = document.getElementById('qr-reader-results');
                if (resultsDiv) {
                    resultsDiv.textContent = 'Сканирование остановлено';
                    resultsDiv.style.color = '#9ca3af';
                }
                if (toggleBtn) {
                    toggleBtn.innerHTML = '<i class="fa-solid fa-play"></i> Запустить камеру';
                    toggleBtn.style.background = '#8b5cf6';
                }
                const readerElement = document.getElementById('qr-reader');
                if (readerElement) {
                    readerElement.innerHTML = '';
                }
            }).catch(err => {
                console.error('Ошибка остановки сканера:', err);
                isScannerRunning = false;
                if (toggleBtn) {
                    toggleBtn.innerHTML = '<i class="fa-solid fa-play"></i> Запустить камеру';
                    toggleBtn.style.background = '#8b5cf6';
                }
            });
        } catch (e) {
            console.error('Ошибка при остановке сканера:', e);
            isScannerRunning = false;
            if (toggleBtn) {
                toggleBtn.innerHTML = '<i class="fa-solid fa-play"></i> Запустить камеру';
                toggleBtn.style.background = '#8b5cf6';
            }
        }
    } else {
        const resultsDiv = document.getElementById('qr-reader-results');
        if (resultsDiv) {
            resultsDiv.textContent = 'Нажмите кнопку для запуска сканирования';
            resultsDiv.style.color = '#9ca3af';
        }
        if (toggleBtn) {
            toggleBtn.innerHTML = '<i class="fa-solid fa-play"></i> Запустить камеру';
            toggleBtn.style.background = '#8b5cf6';
        }
        isScannerRunning = false;
    }
}

window.addEventListener('beforeunload', function() {
    if (html5QrCode && isScannerRunning) {
        try {
            html5QrCode.stop();
        } catch (e) {}
    }
});

window.onload = async function() {
    console.log('=== INDEX: ЗАГРУЗКА ===');
    const isAuth = await checkAuth();
    console.log('Авторизация:', isAuth);
    if (isAuth) {
        isGrouped = loadGroupingState();
        
        const btn = document.getElementById('groupToggleBtn');
        if (btn) {
            if (isGrouped) {
                btn.classList.add('active');
                btn.innerHTML = '<i class="fa-solid fa-layer-group"></i> Группировка включена';
            } else {
                btn.classList.remove('active');
                btn.innerHTML = '<i class="fa-solid fa-layer-group"></i> Группировка отключена';
            }
        }
        
        await loadUniqueValues();
        await loadFilaments();
    }
};
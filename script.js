// Конфигурация
const API_URL = 'https://script.google.com/macros/s/AKfycbx_UvFS-_tWFaq2tGL_rMUhsdcCe9x8ZgpPJPIVtmejVCv-NhenNJYw-0T-G67WdJNnPA/exec'; // Замените на ваш URL

// Глобальные переменные
let TelegramWebApp;
let user;
let currentUserData;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        // Инициализируем Telegram Web App
        TelegramWebApp = window.Telegram.WebApp;
        TelegramWebApp.ready();
        TelegramWebApp.expand();
        
        // Получаем данные пользователя из Telegram
        user = TelegramWebApp.initDataUnsafe?.user;
        
        if (!user) {
            showError('Не удалось получить данные пользователя.');
            return;
        }

        console.log("User from Telegram:", user);
        await loadAppData();
        
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Ошибка при загрузке приложения');
    }
}

async function loadAppData() {
    showLoading(true);

    try {
        // Загружаем данные пользователя
        const userData = await callAPI('getUserData', { telegramId: user.id });
        
        if (userData.error) {
            throw new Error(userData.error);
        }

        currentUserData = userData;
        initializeUI(userData);
        
    } catch (error) {
        console.error('Load app data error:', error);
        showError('Ошибка загрузки данных: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function initializeUI(userData) {
    // Показываем основной контент
    document.getElementById('mainContent').classList.remove('hidden');
    
    // Заполняем данные профиля
    fillProfileData(userData);
    
    // Показываем панель админа если нужно
    if (userData.role === 'Админ' || user.id === 1399930913) {
        document.getElementById('adminPanel').classList.remove('hidden');
        setupAdminListeners();
    }
    
    // Загружаем дополнительные данные
    loadSchedule();
    loadAttendance();
}

function fillProfileData(userData) {
    document.getElementById('userName').textContent = userData.name;
    document.getElementById('userBalance').textContent = `${userData.balance} занятий`;
    document.getElementById('balanceCount').textContent = userData.balance;
    document.getElementById('lastPayment').textContent = `${userData.lastPaymentSum} руб. (${userData.lastPaymentDate})`;
    document.getElementById('userRoleBadge').textContent = userData.role;
    document.getElementById('userRole').textContent = userData.role;
    
    // Обновляем бейдж баланса
    const balanceBadge = document.getElementById('balanceBadge');
    if (userData.balance <= 2) {
        balanceBadge.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a52)';
    }
}

// Навигация по вкладкам
function showTab(tabName) {
    // Скрываем все вкладки
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Убираем активный класс у всех кнопок
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Показываем выбранную вкладку
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // Активируем кнопку
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Загружаем данные для вкладки если нужно
    if (tabName === 'schedule') {
        loadSchedule();
    } else if (tabName === 'attendance') {
        loadAttendance();
    }
}

// Загрузка расписания
async function loadSchedule() {
    try {
        const result = await callAPI('getSchedule');
        const container = document.getElementById('scheduleContainer');
        
        if (result.error) {
            container.innerHTML = '<p class="error-message">Ошибка загрузки расписания</p>';
            return;
        }
        
        if (!result.schedule || result.schedule.length === 0) {
            container.innerHTML = '<p>Расписание пока не загружено</p>';
            return;
        }
        
        let html = '';
        result.schedule.forEach(lesson => {
            html += `
                <div class="schedule-item">
                    <div class="schedule-day">${lesson[0] || ''}</div>
                    <div class="schedule-details">
                        <div class="schedule-time">${lesson[1] || ''}</div>
                        <div class="schedule-level">${lesson[2] || ''} • ${lesson[3] || ''}</div>
                        <div class="schedule-teacher">${lesson[4] || ''}</div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading schedule:', error);
        document.getElementById('scheduleContainer').innerHTML = '<p class="error-message">Ошибка загрузки расписания</p>';
    }
}

// Загрузка посещений
async function loadAttendance() {
    try {
        const result = await callAPI('getLevels');
        const container = document.getElementById('attendanceContainer');
        
        if (result.error || !result.levels) {
            container.innerHTML = '<p>Нет данных о посещениях</p>';
            return;
        }
        
        // Здесь можно добавить загрузку конкретных посещений пользователя
        let html = '<p>Функция просмотра посещений в разработке</p>';
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading attendance:', error);
        document.getElementById('attendanceContainer').innerHTML = '<p>Ошибка загрузки посещений</p>';
    }
}

// API вызовы
async function callAPI(action, data = {}) {
    try {
        const payload = {
            action: action,
            ...data
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        return await response.json();
    } catch (error) {
        console.error('API call error:', error);
        return { error: 'Network error' };
    }
}

// Админ функции
function setupAdminListeners() {
    // Форма добавления ученика
    document.getElementById('addStudentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await addStudent();
    });

    // Форма отметки посещения
    document.getElementById('markAttendanceForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await markAttendance();
    });
}

async function addStudent() {
    const form = document.getElementById('addStudentForm');
    const resultEl = document.getElementById('attendanceResult');
    
    const newStudentData = {
        adminTelegramId: user.id,
        name: document.getElementById('newStudentName').value,
        telegramId: parseInt(document.getElementById('newStudentTelegramId').value),
        telegramUsername: document.getElementById('newStudentUsername').value,
        initialBalance: parseInt(document.getElementById('initialBalance').value),
        paymentSum: parseInt(document.getElementById('initialPayment').value)
    };

    try {
        const result = await callAPI('addStudent', { newStudentData });
        
        if (result.success) {
            showNotification('Ученик успешно добавлен!', 'success');
            form.reset();
        } else {
            showNotification('Ошибка: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error adding student:', error);
        showNotification('Ошибка при добавлении ученика', 'error');
    }
}

async function markAttendance() {
    const form = document.getElementById('markAttendanceForm');
    const resultEl = document.getElementById('attendanceResult');
    resultEl.textContent = 'Обработка...';
    resultEl.className = 'result-message';

    const targetStudentTelegramId = parseInt(document.getElementById('attendanceTelegramId').value);
    const selectedLevel = document.getElementById('levelSelect').value;

    try {
        const result = await callAPI('markAttendance', {
            adminTelegramId: user.id,
            targetStudentTelegramId: targetStudentTelegramId,
            level: selectedLevel
        });

        if (result.success) {
            resultEl.textContent = `✅ Посещение отмечено! Новый баланс: ${result.newBalance}`;
            resultEl.className = 'result-message success';
            document.getElementById('attendanceTelegramId').value = '';
        } else {
            resultEl.textContent = `❌ Ошибка: ${result.error}`;
            resultEl.className = 'result-message error';
        }
    } catch (error) {
        console.error('Error marking attendance:', error);
        resultEl.textContent = '❌ Ошибка при отметке посещения';
        resultEl.className = 'result-message error';
    }
}

// Вспомогательные функции
function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
    document.getElementById('mainContent').classList.toggle('hidden', show);
}

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.remove('hidden');
    
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

function showError(message) {
    showNotification(message, 'error');
}

// Инициализация навигации
document.addEventListener('DOMContentLoaded', function() {
    // Обработчики для табов
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            showTab(tabName);
        });
    });
});

// Заглушки для будущих функций
async function loadAllUsers() {
    showNotification('Функция в разработке', 'info');
}

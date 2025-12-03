// Конфигурация
const API_URL = 'https://script.google.com/macros/s/AKfycbyHFflRoXLnkaRorAC5fH2DFLefN8pCDLqTHHAy0Pweg3OFSApre5JTNfzPN-Zzk4QAWA/exec';

// Глобальные переменные
let TelegramWebApp;
let user;
let currentUserData;

// ====================== ИНИЦИАЛИЗАЦИЯ ======================
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        console.log('🚀 Инициализация приложения...');
        
        // Инициализируем Telegram Web App
        TelegramWebApp = window.Telegram.WebApp;
        TelegramWebApp.ready();
        TelegramWebApp.expand();
        
        // Получаем данные пользователя из Telegram
        user = TelegramWebApp.initDataUnsafe?.user;
        console.log('👤 Пользователь Telegram:', user);
        
        if (!user) {
            console.log('⚠️ Пользователь не найден в Telegram, используем тестовый ID');
            // Тестовый ID для отладки
            user = {
                id: 856749391, // ID Руслана из таблицы
                first_name: "Тестовый",
                username: "test_user"
            };
        }
        
        console.log('📋 Используем Telegram ID:', user.id);
        await loadAppData();
        
    } catch (error) {
        console.error('💥 Ошибка инициализации:', error);
        showError('Ошибка при загрузке приложения');
        showTestData();
    }
}

// ====================== ЗАГРУЗКА ДАННЫХ ======================
async function loadAppData() {
    console.log('📥 Загрузка данных приложения...');
    showLoading(true);
    
    try {
        // Загружаем данные пользователя
        console.log('🔍 Запрашиваем данные для ID:', user.id);
        const userData = await callAPI('getUserData', { telegramId: user.id });
        console.log('📊 Данные пользователя:', userData);
        
        if (userData.error) {
            console.error('❌ Ошибка от API:', userData.error);
            
            // Если пользователь не найден, показываем тестовые данные
            if (userData.error.includes('User not found')) {
                console.log('👤 Пользователь не найден в таблице, показываем тестовые данные');
                showTestData();
            } else {
                showError('Ошибка загрузки данных: ' + userData.error);
                showTestData();
            }
        } else {
            // Реальные данные получены
            currentUserData = userData;
            initializeUI(userData);
            console.log('✅ Реальные данные загружены');
        }
        
    } catch (error) {
        console.error('💥 Ошибка загрузки:', error);
        showError('Ошибка сети: ' + error.message);
        showTestData();
    } finally {
        showLoading(false);
    }
}

// ====================== API ФУНКЦИИ ======================
async function callAPI(action, data = {}) {
    return new Promise((resolve, reject) => {
        console.log('📡 Отправка POST запроса:', { action, data });
        
        const xhr = new XMLHttpRequest();
        const payload = JSON.stringify({
            action: action,
            ...data
        });
        
        xhr.open('POST', API_URL, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onload = function() {
            console.log('✅ Ответ получен, статус:', xhr.status);
            
            try {
                if (xhr.status === 200) {
                    const result = JSON.parse(xhr.responseText);
                    console.log('📊 Ответ:', result);
                    resolve(result);
                } else {
                    resolve({ 
                        error: 'HTTP Error: ' + xhr.status,
                        response: xhr.responseText 
                    });
                }
            } catch (error) {
                console.error('❌ Ошибка парсинга JSON:', error);
                resolve({ 
                    error: 'Invalid JSON response',
                    response: xhr.responseText.substring(0, 200) 
                });
            }
        };
        
        xhr.onerror = function() {
            console.error('❌ Network error');
            resolve({ 
                error: 'Network error - проверьте подключение к интернету'
            });
        };
        
        xhr.ontimeout = function() {
            console.error('❌ Timeout');
            resolve({ error: 'Request timeout' });
        };
        
        xhr.timeout = 10000; // 10 секунд таймаут
        xhr.send(payload);
    });
}

// ====================== ПОКАЗ ДАННЫХ ======================
function initializeUI(userData) {
    // Показываем основной контент
    document.getElementById('mainContent').classList.remove('hidden');
    
    // Заполняем данные профиля
    fillProfileData(userData);
    
    // Показываем панель админа если нужно
    if (userData.role === 'Админ' || (user.id && ['1399930913', '449499727', '856749391'].includes(user.id.toString()))) {
        console.log('👑 Пользователь является администратором');
        document.getElementById('adminPanel').classList.remove('hidden');
        setupAdminListeners();
    }
    
    // Загружаем дополнительные данные
    loadSchedule();
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

// ====================== ТЕСТОВЫЕ ДАННЫЕ ======================
function showTestData() {
    console.log('🔄 Показываем тестовые данные...');
    
    document.getElementById('mainContent').classList.remove('hidden');
    
    // Тестовые данные профиля
    const testData = {
        name: "Руслан",
        balance: 8,
        lastPaymentSum: 5200,
        lastPaymentDate: "11.11.2023",
        role: "Ученик"
    };
    
    fillProfileData(testData);
    
    // Тестовое расписание
    loadTestSchedule();
}

function loadTestSchedule() {
    const testSchedule = [
        ["Понедельник", "19:00", "Зук0", "Начальный", "Антон"],
        ["Среда", "19:00", "Зук1", "Средний", "Лена"],
        ["Пятница", "20:00", "Расход", "Продвинутый", "Оксана"]
    ];
    
    let html = '';
    testSchedule.forEach(lesson => {
        html += `
            <div class="schedule-item">
                <div class="schedule-day">${lesson[0]}</div>
                <div class="schedule-details">
                    <div class="schedule-time">${lesson[1]}</div>
                    <div class="schedule-level">${lesson[2]} • ${lesson[3]}</div>
                    <div class="schedule-teacher">${lesson[4]}</div>
                </div>
            </div>
        `;
    });
    
    document.getElementById('scheduleContainer').innerHTML = html;
}

// ====================== ЗАГРУЗКА РАСПИСАНИЯ ======================
async function loadSchedule() {
    try {
        console.log('📅 Загрузка расписания...');
        const result = await callAPI('getSchedule');
        const container = document.getElementById('scheduleContainer');
        
        if (result.error) {
            console.error('❌ Ошибка загрузки расписания:', result.error);
            loadTestSchedule();
            return;
        }
        
        if (!result.schedule || result.schedule.length === 0) {
            console.log('📅 Расписание пустое, показываем тестовое');
            loadTestSchedule();
            return;
        }
        
        console.log('✅ Расписание загружено, элементов:', result.schedule.length);
        
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
        console.error('💥 Ошибка загрузки расписания:', error);
        loadTestSchedule();
    }
}

// ====================== АДМИН ФУНКЦИИ ======================
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
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.textContent = 'Добавление...';
        submitBtn.disabled = true;
        
        const newStudentData = {
            adminTelegramId: user.id,
            name: document.getElementById('newStudentName').value.trim(),
            telegramId: parseInt(document.getElementById('newStudentTelegramId').value),
            telegramUsername: document.getElementById('newStudentUsername').value.trim(),
            initialBalance: parseInt(document.getElementById('initialBalance').value) || 8,
            paymentSum: parseInt(document.getElementById('initialPayment').value) || 3200
        };
        
        console.log('➕ Добавление ученика:', newStudentData);
        
        const result = await callAPI('addStudent', { newStudentData });
        
        if (result.success) {
            showNotification('✅ Ученик успешно добавлен!', 'success');
            form.reset();
        } else {
            showNotification('❌ Ошибка: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('💥 Ошибка добавления ученика:', error);
        showNotification('❌ Ошибка при добавлении ученика', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function markAttendance() {
    const form = document.getElementById('markAttendanceForm');
    const resultEl = document.getElementById('attendanceResult');
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.textContent = 'Отметка...';
        submitBtn.disabled = true;
        resultEl.textContent = 'Обработка...';
        resultEl.className = 'result-message';
        
        const targetStudentTelegramId = parseInt(document.getElementById('attendanceTelegramId').value);
        const selectedLevel = document.getElementById('levelSelect').value;
        
        console.log('✅ Отметка посещения:', { targetStudentTelegramId, selectedLevel });
        
        const result = await callAPI('markAttendance', {
            adminTelegramId: user.id,
            targetStudentTelegramId: targetStudentTelegramId,
            level: selectedLevel
        });
        
        if (result.success) {
            resultEl.textContent = `✅ Посещение отмечено! Студент: ${result.studentName}, Новый баланс: ${result.newBalance}`;
            resultEl.className = 'result-message success';
            document.getElementById('attendanceTelegramId').value = '';
        } else {
            resultEl.textContent = `❌ Ошибка: ${result.error}`;
            resultEl.className = 'result-message error';
        }
    } catch (error) {
        console.error('💥 Ошибка отметки посещения:', error);
        resultEl.textContent = '❌ Ошибка при отметке посещения';
        resultEl.className = 'result-message error';
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// ====================== НАВИГАЦИЯ ======================
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
    }
}

// ====================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ======================
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

// ====================== ИНИЦИАЛИЗАЦИЯ НАВИГАЦИИ ======================
document.addEventListener('DOMContentLoaded', function() {
    // Обработчики для табов
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            showTab(tabName);
        });
    });
});

// ====================== ТЕСТОВЫЕ ФУНКЦИИ ======================
async function testAPI() {
    console.log('🧪 Тестирование API...');
    
    const testResult = await callAPI('test', { message: 'Test from frontend' });
    console.log('🧪 Результат теста:', testResult);
    
    showNotification('🧪 API тест выполнен, проверьте консоль', 'info');
}

// Функции для отладки (удалить в продакшене)
window.testAPI = testAPI;
window.callAPI = callAPI;

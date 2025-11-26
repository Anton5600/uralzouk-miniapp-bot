// --- КОНФИГУРАЦИЯ ---
const API_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxJjLRl-PCXYCMu8QMfGWpm6FIK92qJrJhvbaZyYMakHnzjnjnUa6fZEclDYfn_eTi5rg/exec'; // <-- ВСТАВЬТЕ СЮДА НОВЫЙ URL РАЗВЕРТЫВАНИЯ!

// Инициализация Telegram WebApp
const webApp = window.Telegram.WebApp;
webApp.ready();

document.addEventListener('DOMContentLoaded', () => {
    // Более надежный способ получения Telegram ID
    const tgInitData = webApp.initDataUnsafe;
    const userId = tgInitData.user?.id || tgInitData.receiver?.id;
    
    // Получаем элементы для отображения
    const loading = document.getElementById('loading');
    const studentData = document.getElementById('student-data');
    const errorDiv = document.getElementById('error-message');

    if (userId) {
        fetchStudentData(userId, loading, studentData, errorDiv);
    } else {
        loading.style.display = 'none';
        showError(errorDiv, 'Не удалось получить ваш Telegram ID. Пожалуйста, запустите Mini App из чата с ботом.');
    }
    
    // Настраиваем главную кнопку Telegram
    webApp.MainButton.setText('Закрыть').show().onClick(() => webApp.close());
});

async function fetchStudentData(tgId, loading, studentData, errorDiv) {
    try {
        // Формируем URL для GET-запроса к Apps Script API
        const url = `${API_ENDPOINT}?action=get_data&tg_id=${tgId}`;
        
        const response = await fetch(url);
        
        // Проверяем, что запрос был успешным (статус 200)
        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        loading.style.display = 'none';

        if (data.status === 'success') {
            const user = data.user;
            document.getElementById('student-name').textContent = user.имя;
            document.getElementById('balance-value').textContent = user.остаток;
            document.getElementById('payment-amount').textContent = `${user.сумма_оплаты} ₽`;
            document.getElementById('payment-date').textContent = user.дата_платежа;
            document.getElementById('schedule').innerHTML = formatText(user.расписание);
            document.getElementById('contacts').innerHTML = formatText(user.контакты);
            studentData.style.display = 'block';
        } else {
            showError(errorDiv, data.error || 'Неизвестная ошибка при получении данных.');
        }

    } catch (error) {
        console.error('Ошибка при обращении к API:', error);
        loading.style.display = 'none';
        showError(errorDiv, 'Ошибка связи с сервером. Попробуйте позже. Детали: ' + error.message);
    }
}

function showError(element, message) {
    element.textContent = message;
    element.style.display = 'block';
}

// Функция для корректного отображения переносов строк
function formatText(text) {
    if (!text) return '';
    return text.replace(/\n/g, '<br>');
}

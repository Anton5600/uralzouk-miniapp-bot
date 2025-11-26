// --- КОНФИГУРАЦИЯ ---
const API_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzk3uam4KN1AUoOFi6T9sEl33kgsDkel-yF3h8gN6lr_akzie2Hsh7dc09mSkl0oxHKQA/exec'; // <-- ЗАМЕНИТЕ ЭТО

// Инициализация Telegram WebApp
const webApp = window.Telegram.WebApp;
webApp.ready();

document.addEventListener('DOMContentLoaded', () => {
    // Получаем ID пользователя из Telegram
    // ВАЖНО: user.id доступен только если бот был запущен пользователем
    const userId = webApp.initDataUnsafe.user?.id;
    
    if (userId) {
        fetchStudentData(userId);
    } else {
        showError('Не удалось получить ваш Telegram ID. Пожалуйста, запустите Mini App из чата с ботом.');
    }
    
    // Закрываем приложение, когда данные получены (необязательно, но полезно)
    webApp.MainButton.setText('Закрыть').show().onClick(() => webApp.close());
});

async function fetchStudentData(tgId) {
    const loading = document.getElementById('loading');
    const studentData = document.getElementById('student-data');
    
    try {
        // Формируем URL для GET-запроса к Apps Script API
        const url = `${API_ENDPOINT}?action=get_data&tg_id=${tgId}`;
        
        const response = await fetch(url);
        const data = await response.json();

        loading.style.display = 'none';

        if (data.status === 'success') {
            const user = data.user;
            document.getElementById('student-name').textContent = user.имя;
            document.getElementById('balance-value').textContent = user.остаток;
            document.getElementById('payment-amount').textContent = `${user.сумма_оплаты} ₽`;
            document.getElementById('payment-date').textContent = user.дата_платежа;
            document.getElementById('schedule').textContent = user.расписание;
            document.getElementById('contacts').textContent = user.контакты;
            studentData.style.display = 'block';
        } else {
            showError(data.error || 'Неизвестная ошибка при получении данных.');
        }

    } catch (error) {
        console.error('Ошибка при обращении к API:', error);
        loading.style.display = 'none';
        showError('Ошибка связи с сервером. Попробуйте позже.');
    }
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

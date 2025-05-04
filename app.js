document.addEventListener('DOMContentLoaded', () => {
    // Get all time input elements
    const timeInputs = document.querySelectorAll('.time-input input');
    const addTimeBtn = document.getElementById('addTimeBtn');
    const calculateBtn = document.getElementById('calculateBtn');
    const changeStoreBtn = document.getElementById('changeStoreBtn');
    const timeInputsContainer = document.getElementById('timeInputs');
    const storeModal = document.getElementById('storeModal');
    const storeForm = document.getElementById('storeForm');
    const storeFilter = document.getElementById('storeFilter');
    const storeNumberInput = document.getElementById('storeNumber');
    const storeNameInput = document.getElementById('storeName');
    
    // Load history and store list
    loadStores();
    loadHistory();
    
    // Load last used store information
    const lastStore = getCurrentStore();
    if (lastStore) {
        const store = JSON.parse(lastStore);
        storeNumberInput.value = store.number;
        storeNameInput.value = store.name;
        // Set the store filter to current store
        storeFilter.value = store.number;
    }
    
    // Add event listeners to all time inputs
    timeInputs.forEach(input => {
        input.addEventListener('input', handleTimeInput);
        input.addEventListener('blur', formatTimeInput);
    });
    
    // Add event listener for Add Time button
    addTimeBtn.addEventListener('click', addNewTimeInput);
    
    // Add event listener for Calculate Average button
    calculateBtn.addEventListener('click', () => {
        if (!getCurrentStore()) {
            storeModal.classList.add('active');
        } else {
            calculateAverage();
        }
    });
    
    // Add event listener for Change Store button
    changeStoreBtn.addEventListener('click', () => {
        storeModal.classList.add('active');
    });
    
    // Add event listener for store form submission
    storeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const storeNumber = storeNumberInput.value;
        const storeName = storeNameInput.value;
        saveStore(storeNumber, storeName);
        storeModal.classList.remove('active');
        calculateAverage();
    });
    
    // Add event listener for store filter
    storeFilter.addEventListener('change', filterHistory);
    
    // Add event listeners for expand buttons
    document.querySelectorAll('.expand-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const group = btn.closest('.history-group');
            group.classList.toggle('expanded');
        });
    });
});

function handleTimeInput(e) {
    const input = e.target;
    const value = input.value;
    
    // Validate input
    if (value.length > 2) {
        input.value = value.slice(0, 2);
    }
    
    // Auto-focus to next input when two digits are entered
    if (value.length === 2) {
        const nextInput = input.nextElementSibling;
        if (nextInput && nextInput.tagName === 'INPUT') {
            nextInput.focus();
        } else if (input.id.includes('-min')) {
            // If we're in minutes input, focus the seconds input
            const secondsInput = input.parentElement.querySelector(`#${input.id.replace('-min', '-sec')}`);
            if (secondsInput) {
                secondsInput.focus();
            }
        }
    }
    
    // Validate seconds (0-59)
    if (input.id.includes('-sec')) {
        const numValue = parseInt(value);
        if (numValue > 59) {
            input.value = '59';
        }
    }
    
    // Ensure non-negative values
    if (value < 0) {
        input.value = '0';
    }
}

function formatTimeInput(e) {
    const input = e.target;
    const value = input.value;
    
    // Add leading zero for single digits
    if (value.length === 1) {
        input.value = '0' + value;
    }
    
    // Handle empty inputs
    if (value === '') {
        input.value = '00';
    }
}

function addNewTimeInput() {
    const timeInputs = document.querySelectorAll('.time-input');
    const newIndex = timeInputs.length + 1;
    
    const newTimeInput = document.createElement('div');
    newTimeInput.className = 'time-input';
    newTimeInput.innerHTML = `
        <label for="time${newIndex}">Time ${newIndex}:</label>
        <input type="number" id="time${newIndex}-min" placeholder="MM" min="0" maxlength="2">
        <span class="separator">:</span>
        <input type="number" id="time${newIndex}-sec" placeholder="SS" min="0" max="59" maxlength="2">
    `;
    
    document.getElementById('timeInputs').appendChild(newTimeInput);
    
    // Add event listeners to new inputs
    const newInputs = newTimeInput.querySelectorAll('input');
    newInputs.forEach(input => {
        input.addEventListener('input', handleTimeInput);
        input.addEventListener('blur', formatTimeInput);
    });
}

function calculateAverage() {
    const timeInputs = document.querySelectorAll('.time-input');
    let totalSeconds = 0;
    let validInputs = 0;
    
    timeInputs.forEach((timeInput, index) => {
        const minutes = parseInt(timeInput.querySelector(`#time${index + 1}-min`).value) || 0;
        const seconds = parseInt(timeInput.querySelector(`#time${index + 1}-sec`).value) || 0;
        
        if (minutes > 0 || seconds > 0) {
            totalSeconds += (minutes * 60) + seconds;
            validInputs++;
        }
    });
    
    if (validInputs === 0) {
        alert('Please enter at least one valid time');
        return;
    }
    
    const averageSeconds = Math.round(totalSeconds / validInputs);
    const averageMinutes = Math.floor(averageSeconds / 60);
    const remainingSeconds = averageSeconds % 60;
    
    const averageTime = `${averageMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    
    // Add to history
    addToHistory(averageTime);
}

function getCurrentStore() {
    // First try to get the current store
    let store = localStorage.getItem('currentStore');
    
    // If no current store, try to get the last used store
    if (!store) {
        store = localStorage.getItem('lastUsedStore');
        if (store) {
            localStorage.setItem('currentStore', store);
        }
    }
    
    return store;
}

function saveStore(storeNumber, storeName) {
    const store = { number: storeNumber, name: storeName };
    localStorage.setItem('currentStore', JSON.stringify(store));
    
    // Add to store list if not exists
    const stores = JSON.parse(localStorage.getItem('stores') || '[]');
    if (!stores.some(s => s.number === storeNumber)) {
        stores.push(store);
        localStorage.setItem('stores', JSON.stringify(stores));
        updateStoreFilter();
    }
    
    // Save as last used store
    localStorage.setItem('lastUsedStore', JSON.stringify(store));
}

function loadStores() {
    const stores = JSON.parse(localStorage.getItem('stores') || '[]');
    if (stores.length > 0) {
        updateStoreFilter();
    }
}

function updateStoreFilter() {
    const stores = JSON.parse(localStorage.getItem('stores') || '[]');
    const storeFilter = document.getElementById('storeFilter');
    
    // Clear existing options except "All Stores"
    while (storeFilter.options.length > 1) {
        storeFilter.remove(1);
    }
    
    // Add store options
    stores.forEach(store => {
        const option = document.createElement('option');
        option.value = store.number;
        option.textContent = `${store.number} - ${store.name}`;
        storeFilter.appendChild(option);
    });
}

function addToHistory(time) {
    const store = JSON.parse(getCurrentStore());
    const now = new Date();
    const historyItem = {
        time,
        store: store.number,
        storeName: store.name,
        date: now.toISOString()
    };
    
    // Get existing history
    const history = JSON.parse(localStorage.getItem('timeHistory') || '[]');
    history.unshift(historyItem);
    localStorage.setItem('timeHistory', JSON.stringify(history));
    
    // Update history display
    loadHistory();
}

function loadHistory() {
    const history = JSON.parse(localStorage.getItem('timeHistory') || '[]');
    const selectedStore = document.getElementById('storeFilter').value;
    
    // Clear existing history
    document.querySelectorAll('.history-list').forEach(list => {
        list.innerHTML = '';
    });
    
    // Group history items by date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const lastYear = new Date(today);
    lastYear.setFullYear(lastYear.getFullYear() - 1);
    
    let hasEntries = false;
    
    history.forEach(item => {
        if (selectedStore !== 'all' && item.store !== selectedStore) return;
        
        const itemDate = new Date(item.date);
        let period = 'lastYear';
        
        if (itemDate >= today) {
            period = 'today';
        } else if (itemDate >= yesterday) {
            period = 'yesterday';
        } else if (itemDate >= lastWeek) {
            period = 'lastWeek';
        } else if (itemDate >= lastMonth) {
            period = 'lastMonth';
        }
        
        const historyItem = document.createElement('li');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <span class="history-time">${item.time}</span>
            <span class="history-store">${item.storeName} (${item.store})</span>
            <span class="history-date">${new Date(item.date).toLocaleString()}</span>
        `;
        
        const group = document.querySelector(`[data-period="${period}"]`);
        group.querySelector('.history-list').appendChild(historyItem);
        
        // Expand the group if it has entries
        if (!group.classList.contains('expanded')) {
            group.classList.add('expanded');
            hasEntries = true;
        }
    });
    
    // If no entries found, show a message
    if (!hasEntries) {
        const noEntries = document.createElement('li');
        noEntries.className = 'history-item';
        noEntries.innerHTML = '<span class="no-entries">No entries found</span>';
        document.querySelector('[data-period="today"] .history-list').appendChild(noEntries);
        document.querySelector('[data-period="today"]').classList.add('expanded');
    }
}

function filterHistory() {
    loadHistory();
} 
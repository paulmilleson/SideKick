const currentDisplay = document.getElementById('current');
const historyDisplay = document.getElementById('history');
const keypad = document.getElementById('keypad');

let currentOperand = '0';
let previousOperand = '';
let operation = null;
let shouldResetScreen = false;

function formatNumber(number) {
    if (number === '-' || number === '') return number;
    const stringNumber = number.toString();
    const integerDigits = parseFloat(stringNumber.split('.')[0]);
    const decimalDigits = stringNumber.split('.')[1];
    
    let integerDisplay;
    if (isNaN(integerDigits)) {
        integerDisplay = '';
    } else {
        integerDisplay = integerDigits.toLocaleString('en', { maximumFractionDigits: 0 });
    }
    
    if (decimalDigits != null) {
        return `${integerDisplay}.${decimalDigits}`;
    } else {
        return integerDisplay;
    }
}

function updateDisplay() {
    currentDisplay.innerText = formatNumber(currentOperand);
    if (operation != null) {
        let opSymbol = operation;
        if (operation === '*') opSymbol = '×';
        if (operation === '/') opSymbol = '÷';
        historyDisplay.innerText = `${formatNumber(previousOperand)} ${opSymbol}`;
    } else {
        historyDisplay.innerText = '';
    }
}

function clear() {
    currentOperand = '0';
    previousOperand = '';
    operation = null;
    shouldResetScreen = false;
}

function deleteNumber() {
    if (currentOperand === '0' || shouldResetScreen) {
        shouldResetScreen = false;
        return;
    }
    currentOperand = currentOperand.toString().slice(0, -1);
    if (currentOperand === '' || currentOperand === '-') currentOperand = '0';
}

function appendNumber(number) {
    if (currentOperand === '0' && number !== '.') {
        currentOperand = number;
        return;
    }
    if (shouldResetScreen) {
        currentOperand = number;
        shouldResetScreen = false;
        return;
    }
    if (number === '.' && currentOperand.includes('.')) return;
    currentOperand = currentOperand.toString() + number;
}

function chooseOperation(op) {
    if (currentOperand === '0' && op === '-') {
        currentOperand = '-';
        return;
    }
    if (currentOperand === '-' || currentOperand === '') return;
    if (previousOperand !== '') {
        calculate();
    }
    operation = op;
    previousOperand = currentOperand;
    currentOperand = '0';
}

function calculate() {
    let result;
    const prev = parseFloat(previousOperand);
    const current = parseFloat(currentOperand);
    if (isNaN(prev) || isNaN(current)) return;
    switch (operation) {
        case '+':
            result = prev + current;
            break;
        case '-':
            result = prev - current;
            break;
        case '*':
            result = prev * current;
            break;
        case '/':
            if (current === 0) {
                result = 'Error';
            } else {
                result = prev / current;
            }
            break;
        case '%':
            result = prev % current;
            break;
        default:
            return;
    }
    if (result === 'Error') {
        currentOperand = 'Error';
    } else {
        currentOperand = result.toString();
    }
    operation = null;
    previousOperand = '';
    shouldResetScreen = true;
}

keypad.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON') return;
    
    if (currentOperand === 'Error' && e.target.dataset.action !== 'clear') {
        clear();
    }
    
    const btn = e.target;
    const action = btn.dataset.action;
    const val = btn.dataset.val;

    if (action === 'number') {
        appendNumber(val);
    } else if (action === 'operator') {
        chooseOperation(val);
    } else if (action === 'decimal') {
        appendNumber(val);
    } else if (action === 'clear') {
        clear();
    } else if (action === 'delete') {
        deleteNumber();
    } else if (action === 'calculate') {
        calculate();
    }
    updateDisplay();
});

document.addEventListener('keydown', (e) => {
    if (currentOperand === 'Error' && e.key !== 'Escape') {
        clear();
    }

    if (e.key >= '0' && e.key <= '9') {
        appendNumber(e.key);
        updateDisplay();
    } else if (e.key === '.') {
        appendNumber(e.key);
        updateDisplay();
    } else if (e.key === '=' || e.key === 'Enter') {
        e.preventDefault();
        calculate();
        updateDisplay();
    } else if (e.key === 'Backspace') {
        deleteNumber();
        updateDisplay();
    } else if (e.key === 'Escape') {
        clear();
        updateDisplay();
    } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/' || e.key === '%') {
        chooseOperation(e.key);
        updateDisplay();
    }
});

updateDisplay();

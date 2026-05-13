
class Calculator {
    constructor() {
        this.currentExpression = '';
        this.currentResult = null;
        this.memoryValue = null;
        this.history = this.loadHistory();
        this.init();
    }

    init() {
        this.cacheElements();
        this.attachEvents();
        this.renderHistory();
        this.updateDisplay();
        this.updateMemoryIndicator();
    }


    cacheElements() {
        this.expressionEl = document.getElementById('expression');
        this.resultEl = document.getElementById('result');
        this.historyList = document.getElementById('historyList');
        this.memoryIndicator = document.getElementById('memoryIndicator');
    }


    attachEvents() {

        document.querySelectorAll('.btn-number').forEach(btn => {
            btn.addEventListener('click', () => {
                const num = btn.getAttribute('data-num');
                this.appendNumber(num);
            });
        });


        document.querySelectorAll('.btn-operator').forEach(btn => {
            btn.addEventListener('click', () => {
                const op = btn.getAttribute('data-op');
                this.appendOperator(op);
            });
        });


        document.querySelector('[data-action="clear"]').addEventListener('click', () => {
            this.clear();
        });

        document.querySelector('[data-action="delete"]').addEventListener('click', () => {
            this.deleteLast();
        });


        document.querySelector('[data-action="equals"]').addEventListener('click', () => {
            this.calculate();
        });


        document.getElementById('saveToMemoryBtn').addEventListener('click', () => {
            this.saveToMemory();
        });

        document.getElementById('recallMemoryBtn').addEventListener('click', () => {
            this.recallMemory();
        });

        document.getElementById('clearLogBtn').addEventListener('click', () => {
            this.clearHistory();
        });

        document.getElementById('clearHistoryBtn').addEventListener('click', () => {
            this.clearHistory();
        });


        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });
    }

    appendNumber(num) {
        if (num === '.') {
            // Проверяем, чтобы не было двух точек в текущем числе
            const lastNumber = this.getLastNumber();
            if (lastNumber && lastNumber.includes('.')) return;
            if (this.currentExpression === '' || this.isOperatorLast()) {
                this.currentExpression += '0';
            }
        }

        this.currentExpression += num;
        this.updateDisplay();
    }


    appendOperator(op) {
        if (this.currentExpression === '') return;

        const displayOp = this.getDisplayOperator(op);

        if (this.isOperatorLast()) {
            this.currentExpression = this.currentExpression.slice(0, -1) + displayOp;
        } else {
            this.currentExpression += displayOp;
        }

        this.updateDisplay();
    }

    getDisplayOperator(op) {
        const map = {
            '+': '+', '-': '-', '*': '×', '/': '÷', '%': '%', '^': '^'
        };
        return map[op] || op;
    }


    getMathOperator(opChar) {
        const map = {
            '+': '+', '-': '-', '×': '*', '÷': '/', '%': '%', '^': '^'
        };
        return map[opChar] || opChar;
    }


    isOperatorLast() {
        if (this.currentExpression === '') return false;
        const lastChar = this.currentExpression[this.currentExpression.length - 1];
        return ['+', '-', '×', '÷', '%', '^'].includes(lastChar);
    }

    getLastNumber() {
        const match = this.currentExpression.match(/[\d\.]+$/);
        return match ? match[0] : null;
    }


    calculate() {
        if (this.currentExpression === '') return;

        // Проверяем, не заканчивается ли на оператор
        if (this.isOperatorLast()) {
            this.currentExpression = this.currentExpression.slice(0, -1);
        }

        try {

            let exprToEval = this.currentExpression
                .replace(/×/g, '*')
                .replace(/÷/g, '/');

            exprToEval = this.handlePower(exprToEval);


            const result = Function('"use strict";return (' + exprToEval + ')')();

            if (isNaN(result) || !isFinite(result)) {
                throw new Error('Некорректное выражение');
            }


            const roundedResult = Math.round(result * 10000000000) / 10000000000;
            this.currentResult = roundedResult;


            this.resultEl.textContent = `= ${roundedResult}`;


            this.addToHistory(this.currentExpression, roundedResult);


            this.currentExpression = roundedResult.toString();
            this.updateDisplay();

        } catch (error) {
            this.resultEl.textContent = '= Ошибка';
            setTimeout(() => {
                this.resultEl.textContent = '= 0';
            }, 1500);
        }
    }


    handlePower(expression) {
        //  ^ на **
        return expression.replace(/(\d+(?:\.\d+)?)\^(\d+(?:\.\d+)?)/g, 'Math.pow($1, $2)');
    }


    evaluateExpression(expression) {
        try {
            let exprToEval = expression.replace(/×/g, '*').replace(/÷/g, '/');
            exprToEval = this.handlePower(exprToEval);
            const result = Function('"use strict";return (' + exprToEval + ')')();
            if (isNaN(result) || !isFinite(result)) return null;
            return Math.round(result * 10000000000) / 10000000000;
        } catch {
            return null;
        }
    }

    // Очистка всего
    clear() {
        this.currentExpression = '';
        this.currentResult = null;
        this.updateDisplay();
        this.resultEl.textContent = '= 0';
    }


    deleteLast() {
        this.currentExpression = this.currentExpression.slice(0, -1);
        this.updateDisplay();
        if (this.currentExpression === '') {
            this.resultEl.textContent = '= 0';
        }
    }


    updateDisplay() {
        if (this.currentExpression === '') {
            this.expressionEl.textContent = '0';
        } else {
            this.expressionEl.textContent = this.currentExpression;
        }
    }

    // Добавление в историю
    addToHistory(expression, result) {
        const historyItem = {
            id: Date.now(),
            expression: expression,
            result: result,
            timestamp: new Date().toLocaleString()
        };

        this.history.unshift(historyItem);

        if (this.history.length > 50) {
            this.history = this.history.slice(0, 50);
        }

        this.saveHistory();
        this.renderHistory();
    }




    renderHistory() {
        if (!this.historyList) return;

        if (this.history.length === 0) {
            this.historyList.innerHTML = '<div class="history-empty">Нет сохранённых вычислений</div>';
            return;
        }

        this.historyList.innerHTML = this.history.map(item => `
            <div class="history-item" data-id="${item.id}">
                <div class="history-expression">${item.expression}</div>
                <div class="history-result">= ${item.result}</div>
                <div class="history-time">${item.timestamp}</div>
            </div>
        `).join('');

        document.querySelectorAll('.history-item').forEach(el => {
            el.addEventListener('click', () => {
                const id = parseInt(el.getAttribute('data-id'));
                const historyItem = this.history.find(h => h.id === id);
                if (historyItem) {
                    this.currentExpression = historyItem.expression;
                    this.currentResult = historyItem.result;
                    this.updateDisplay();
                    this.resultEl.textContent = `= ${historyItem.result}`;
                }
            });
        });
    }

    // Очистка истории
    clearHistory() {
        this.history = [];
        this.saveHistory();
        this.renderHistory();
    }


    saveHistory() {
        localStorage.setItem('calculatorHistory', JSON.stringify(this.history));
    }


    loadHistory() {
        const saved = localStorage.getItem('calculatorHistory');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return [];
            }
        }
        return [];
    }

    // Сохранение в память
    saveToMemory() {
        if (this.currentResult !== null && !isNaN(this.currentResult)) {
            this.memoryValue = this.currentResult;
            this.updateMemoryIndicator();
            const indicator = this.memoryIndicator;
            indicator.style.background = 'rgba(74, 222, 128, 0.3)';
            setTimeout(() => {
                indicator.style.background = '';
            }, 500);
        } else if (this.currentExpression !== '') {
            const result = this.evaluateExpression(this.currentExpression);
            if (result !== null) {
                this.memoryValue = result;
                this.updateMemoryIndicator();
            }
        }
    }

    // Восстановление из памяти
    recallMemory() {
        if (this.memoryValue !== null) {
            this.currentExpression = this.memoryValue.toString();
            this.updateDisplay();
            this.resultEl.textContent = `= ${this.memoryValue}`;
            this.currentResult = this.memoryValue;
        } else {

            this.memoryIndicator.style.background = 'rgba(255, 80, 80, 0.3)';
            setTimeout(() => {
                this.memoryIndicator.style.background = '';
            }, 500);
        }
    }


    updateMemoryIndicator() {
        if (this.memoryIndicator) {
            if (this.memoryValue !== null) {
                this.memoryIndicator.textContent = `💾 В памяти: ${this.memoryValue}`;
                this.memoryIndicator.style.color = '#4ade80';
            } else {
                this.memoryIndicator.textContent = 'Память пуста';
                this.memoryIndicator.style.color = '#ffd966';
            }
        }
    }


    handleKeyboard(e) {
        const key = e.key;
        if (key.startsWith('F') && key.length >= 2) {
            const fNumber = parseInt(key.substring(1));
            if (fNumber >= 1 && fNumber <= 12) {
                e.preventDefault();
                return;
            }
        }
        // Цифры и точка
        else if (/[\d\.]/.test(key)) {
            e.preventDefault();
            this.appendNumber(key);
        }

        else if (['+', '-', '*', '/', '%'].includes(key)) {
            e.preventDefault();
            let op = key;
            if (key === '*') op = '^';
            if (key === '/') op = '÷';
            this.appendOperator(op);
        }

        else if (key === '^') {
            e.preventDefault();
            this.appendOperator('^');
        }

        else if (key === 'Enter' || key === '=') {
            e.preventDefault();
            this.calculate();
        }

        else if (key === 'Escape') {
            e.preventDefault();
            this.clear();
        }

        else if (key === 'Backspace') {
            e.preventDefault();
            this.deleteLast();
        }
    }
}


document.addEventListener('DOMContentLoaded', () => {
    new Calculator();
});
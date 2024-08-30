document.getElementById('tickerForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const tickers = document.getElementById('tickers').value.split(',').map(ticker => ticker.trim().toUpperCase());
    const resultsDiv = document.getElementById('results');
    const loadingDiv = document.getElementById('loading');

    resultsDiv.innerHTML = '';
    loadingDiv.style.display = 'block';

    try {
        for (const ticker of tickers) {
            // Fetch stock data using Yahoo Finance API
            const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=1y&interval=1d`);
            const data = response.data.chart.result[0];
            const prices = data.indicators.quote[0].close;

            // Calculate indicators
            const sma_20 = calculateSMA(prices, 20);
            const sma_50 = calculateSMA(prices, 50);
            const rsi = calculateRSI(prices);
            const macd = calculateMACD(prices);
            const pivot = calculatePivot(data);
            const support_1 = calculateSupport(pivot, data);
            const resistance_1 = calculateResistance(pivot, data);

            // Display the result
            resultsDiv.innerHTML += `
                <h2>${ticker}</h2>
                <p>Close Price: ${prices[prices.length - 1]}</p>
                <p>20-Day SMA: ${sma_20}</p>
                <p>50-Day SMA: ${sma_50}</p>
                <p>RSI: ${rsi}</p>
                <p>MACD: ${macd.macd}</p>
                <p>MACD Signal: ${macd.signal}</p>
                <p>Support 1: ${support_1}</p>
                <p>Resistance 1: ${resistance_1}</p>
            `;
        }
    } catch (error) {
        console.error('An error occurred:', error);
        resultsDiv.innerHTML = '<p>An error occurred while processing the data.</p>';
    } finally {
        loadingDiv.style.display = 'none';
    }
});

// Simple Moving Average (SMA)
function calculateSMA(prices, period) {
    let sum = 0;
    for (let i = prices.length - period; i < prices.length; i++) {
        sum += prices[i];
    }
    return sum / period;
}

// Relative Strength Index (RSI)
function calculateRSI(prices) {
    let gains = 0;
    let losses = 0;
    for (let i = 1; i < prices.length; i++) {
        const change = prices[i] - prices[i - 1];
        if (change > 0) {
            gains += change;
        } else {
            losses -= change;
        }
    }
    const relativeStrength = gains / losses;
    return 100 - (100 / (1 + relativeStrength));
}

// Moving Average Convergence Divergence (MACD)
function calculateMACD(prices) {
    const ema12 = calculateEMA(prices, 12);
    const ema26 = calculateEMA(prices, 26);
    const macd = ema12 - ema26;
    const signal = calculateEMA(prices.slice(-9), 9);
    return { macd, signal };
}

function calculateEMA(prices, period) {
    const k = 2 / (period + 1);
    let ema = prices[0];
    for (let i = 1; i < prices.length; i++) {
        ema = prices[i] * k + ema * (1 - k);
    }
    return ema;
}

// Pivot, Support, and Resistance calculations
function calculatePivot(data) {
    const lastClose = data.indicators.quote[0].close.slice(-1)[0];
    const lastHigh = data.indicators.quote[0].high.slice(-1)[0];
    const lastLow = data.indicators.quote[0].low.slice(-1)[0];
    return (lastHigh + lastLow + lastClose) / 3;
}

function calculateSupport(pivot, data) {
    const lastHigh = data.indicators.quote[0].high.slice(-1)[0];
    return (2 * pivot) - lastHigh;
}

function calculateResistance(pivot, data) {
    const lastLow = data.indicators.quote[0].low.slice(-1)[0];
    return (2 * pivot) - lastLow;
}

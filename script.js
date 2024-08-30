document.getElementById('tickerForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const tickers = document.getElementById('tickers').value.split(',').map(ticker => ticker.trim().toUpperCase());
    const resultsDiv = document.getElementById('results');
    const loadingDiv = document.getElementById('loading');

    resultsDiv.innerHTML = '';
    loadingDiv.style.display = 'block';

    try {
        console.log('Loading Pyodide...');
        let pyodide = await loadPyodide();
        console.log('Pyodide loaded');

        console.log('Loading packages...');
        await pyodide.loadPackage("pandas");
        await pyodide.loadPackage("micropip");

        console.log('Installing yfinance...');
        await pyodide.runPythonAsync(`
            import micropip
            await micropip.install('yfinance')
            import yfinance as yf
            import pandas as pd
        `);
        console.log('yfinance installed');

        for (const ticker of tickers) {
            console.log(`Fetching data for ticker: ${ticker}`);
            let result = await pyodide.runPythonAsync(`
                ticker = "${ticker}"
                stock = yf.Ticker(ticker)
                data = stock.history(period='1y')

                sma_20 = data['Close'].rolling(window=20).mean().iloc[-1]
                sma_50 = data['Close'].rolling(window=50).mean().iloc[-1]
                rsi = (data['Close'].diff().apply(lambda x: max(x, 0)).mean() / data['Close'].diff().apply(lambda x: abs(x)).mean()) * 100
                macd = data['Close'].ewm(span=12, adjust=False).mean().iloc[-1] - data['Close'].ewm(span=26, adjust=False).mean().iloc[-1]
                macd_signal = macd - (data['Close'].ewm(span=9, adjust=False).mean().iloc[-1])

                pivot = (data['High'] + data['Low'] + data['Close']) / 3
                support_1 = (2 * pivot) - data['High'].iloc[-1]
                resistance_1 = (2 * pivot) - data['Low'].iloc[-1]

                result = {
                    "ticker": ticker,
                    "close_price": data['Close'].iloc[-1],
                    "sma_20": sma_20,
                    "sma_50": sma_50,
                    "rsi": rsi,
                    "macd": macd,
                    "macd_signal": macd_signal,
                    "support_1": support_1.iloc[-1],
                    "resistance_1": resistance_1.iloc[-1]
                }
                result
            `);

            let parsedResult = JSON.parse(result);
            console.log(`Result for ${ticker}: `, parsedResult);

            resultsDiv.innerHTML += `
                <h2>${parsedResult.ticker}</h2>
                <p>Close Price: ${parsedResult.close_price}</p>
                <p>20-Day SMA: ${parsedResult.sma_20}</p>
                <p>50-Day SMA: ${parsedResult.sma_50}</p>
                <p>RSI: ${parsedResult.rsi}</p>
                <p>MACD: ${parsedResult.macd}</p>
                <p>MACD Signal: ${parsedResult.macd_signal}</p>
                <p>Support 1: ${parsedResult.support_1}</p>
                <p>Resistance 1: ${parsedResult.resistance_1}</p>
            `;
        }
        console.log('All tickers processed');
    } catch (error) {
        console.error('An error occurred:', error);
        resultsDiv.innerHTML = '<p>An error occurred while processing the data.</p>';
    } finally {
        loadingDiv.style.display = 'none';
    }
});

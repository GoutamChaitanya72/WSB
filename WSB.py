import yfinance as yf
import pandas_ta as ta
import pandas as pd
from jinja2 import Environment, FileSystemLoader

# Fetch stock data
def fetch_stock_data(ticker, period='1y', interval='1d'):
    stock = yf.Ticker(ticker)
    data = stock.history(period=period, interval=interval)
    return data

# Add technical indicators
def add_technical_indicators(data):
    data['SMA_20'] = ta.sma(data['Close'], length=20)
    data['SMA_50'] = ta.sma(data['Close'], length=50)
    data['RSI'] = ta.rsi(data['Close'], length=14)
    data['MACD'], data['MACD_Signal'], _ = ta.macd(data['Close'])
    return data

# Calculate support and resistance
def calculate_support_resistance(data):
    data['Pivot'] = (data['High'] + data['Low'] + data['Close']) / 3
    data['Support_1'] = (2 * data['Pivot']) - data['High']
    data['Resistance_1'] = (2 * data['Pivot']) - data['Low']
    data['Support_2'] = data['Pivot'] - (data['High'] - data['Low'])
    data['Resistance_2'] = data['Pivot'] + (data['High'] - data['Low'])
    return data

# Simple buy/sell recommendation based on SMA and RSI
def simple_recommendation(data):
    last_rsi = data['RSI'].iloc[-1]
    last_price = data['Close'].iloc[-1]
    sma_20 = data['SMA_20'].iloc[-1]
    sma_50 = data['SMA_50'].iloc[-1]

    if last_price > sma_20 and last_price > sma_50 and last_rsi < 70:
        return "Buy"
    elif last_price < sma_50 and last_rsi > 70:
        return "Sell"
    else:
        return "Hold"

# Generate HTML for each ticker
def generate_html(tickers):
    env = Environment(loader=FileSystemLoader('templates'))
    template = env.get_template('index_template.html')

    results = []
    for ticker in tickers:
        data = fetch_stock_data(ticker)
        data = add_technical_indicators(data)
        data = calculate_support_resistance(data)

        result = {
            'ticker': ticker,
            'close_price': data['Close'].iloc[-1],
            'sma_20': data['SMA_20'].iloc[-1],
            'sma_50': data['SMA_50'].iloc[-1],
            'rsi': data['RSI'].iloc[-1],
            'macd': data['MACD'].iloc[-1],
            'macd_signal': data['MACD_Signal'].iloc[-1],
            'support_1': data['Support_1'].iloc[-1],
            'resistance_1': data['Resistance_1'].iloc[-1],
            'recommendation': simple_recommendation(data)
        }
        results.append(result)

    # Render the template with results
    html_output = template.render(results=results)
    
    # Write the HTML to a file
    with open('index.html', 'w') as f:
        f.write(html_output)

# Input tickers dynamically
tickers = input("Enter tickers separated by commas: ").split(',')
tickers = [ticker.strip().upper() for ticker in tickers]

# Generate HTML files
generate_html(tickers)

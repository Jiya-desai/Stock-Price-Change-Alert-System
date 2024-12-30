from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
import threading
import time
from yahoo_fin import stock_info

app = Flask(__name__)

# enabling CORS:
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})


socketio = SocketIO(app, cors_allowed_origins="http://localhost:3000")

# for logging active alerts:
active_alerts = {}
stock_price_cache = {}
cache_timeout = 300

# fetching stock prices using the y-finance API:
def get_stock_price(symbol):
    current_time = time.time()

    if symbol in stock_price_cache and current_time - stock_price_cache[symbol]['timestamp'] < cache_timeout:
        return stock_price_cache[symbol]['price'], None

    try:
        price = stock_info.get_live_price(symbol)

        # storing fetched price in the cache:
        stock_price_cache[symbol] = {
            'price': price,
            'timestamp': current_time
        }

        return price, None # no error
    except Exception as e:
        return None, str(e)

# for continous monitoring (every 30 seconds)
def monitor_alerts():
    while True:
        for symbol, (threshold, alert_message) in active_alerts.items():
            price, error = get_stock_price(symbol) 

            if price is None:
                print(f"Error fetching price for {symbol}: {error}")
                continue

            if price >= threshold:
                print(f"ALERT: {symbol} has crossed the threshold! Current price: {price}")
                socketio.emit('stock_alert', {'symbol': symbol, 'message': f"{symbol} has crossed the threshold at {price}"})

        time.sleep(30)  # interval for checking


@app.route('/api/set-alert', methods=['POST'])
def set_alert():
    data = request.json
    symbol = data.get('symbol')
    threshold = float(data.get('threshold'))

    # appending to active_alerts dictionary:
    active_alerts[symbol] = (threshold, f"Alert for {symbol} at {threshold}")

    return jsonify({
        'message': f'Alert set for {symbol} at {threshold}. Monitoring...'
    })

if __name__ == '__main__':
    alert_thread = threading.Thread(target=monitor_alerts)
    alert_thread.daemon = True
    alert_thread.start()

    socketio.run(app, debug=True)


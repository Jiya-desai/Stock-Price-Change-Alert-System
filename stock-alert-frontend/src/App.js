import React, { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";

import "./App.css"; // css

function App() {
  const [symbol, setSymbol] = useState("");
  const [threshold, setThreshold] = useState("");
  const [message, setMessage] = useState("");
  const [alertSet, setAlertSet] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // estabilishing a socket connection:
  useEffect(() => {
    const socket = io("http://127.0.0.1:5000"); // backend server port

    socket.on("stock_alert", (data) => {
      setAlerts((prevAlerts) => [...prevAlerts, data.message]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const setAlert = async () => {
    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/api/set-alert",
        { symbol, threshold }
      );

      const data = response.data;

      if (data.error) {
        setMessage(`Error: ${data.error}`);
      } else {
        setMessage(data.message);
        setAlertSet(true);
      }
    } catch (error) {
      setMessage(`Error fetching stock price: ${error.message}`);
      console.error("Error:", error);
    }
  };

  // website features:
  const handleScroll = () => {
    if (window.scrollY > 200) {
      setShowBackToTop(true);
    } else {
      setShowBackToTop(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="app-container">
      <h1 className="app-header">Stock Price Change Alert System</h1>
      <div className="form-container">
        <div className="form-group">
          <label htmlFor="symbol">Enter a Stock Symbol:</label>
          <input
            id="symbol"
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="Enter stock symbol (e.g., AAPL)"
          />
        </div>
        <div className="form-group">
          <label htmlFor="threshold">Enter a Threshold Price:</label>
          <input
            id="threshold"
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            placeholder="Enter threshold price"
          />
        </div>
        <button onClick={setAlert} className="set-alert-button"> 
          Set Alert
        </button>
      </div>

      {message && <p className="message">{message}</p>}
      {alertSet && <p className="alert-set">Alert is set for {symbol} at ${threshold}</p>}

      <h2 className="alerts-header">Alerts:</h2>
      <div className="alerts-container">
        {alerts.length > 0 ? (
          <ul className="alerts-list">
            {alerts.map((alert, index) => (
              <li key={index} className="alert-item">{alert}</li>
            ))}
          </ul>
        ) : (
          <p className="no-alerts">No alerts yet</p>
        )}
      </div>

      {showBackToTop && (
        <button className="back-to-top-button" onClick={scrollToTop}>
          ↑ Back to Top
        </button>
      )}
    </div>
  );
}

export default App;

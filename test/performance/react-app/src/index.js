import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <div>
      init array time: <span id="init-time"></span>ms
    </div>
    <div>
      set array item time: <span id="reset-item-time"></span>ms
    </div>
    <div>
      splice array item time (insert item time): <span id="splice1-time"></span>
      ms
    </div>
    <div>
      splice array item time (remove item time): <span id="splice2-time"></span>
      ms
    </div>
    <div>
      reset array time: <span id="reset-time"></span>ms
    </div>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/tailwind.css";
import { Provider } from "react-redux";
import { store } from "@/redux/store";
import { ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import dayjs from "dayjs";
import "dayjs/locale/vi";

dayjs.locale("vi");

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <ConfigProvider
        locale={viVN}
        theme={{
          token: {
            colorPrimary: "#1677ff",
            borderRadius: 8,
          },
        }}
      >
        <App />
      </ConfigProvider>
    </Provider>
  </React.StrictMode>
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import "./styles/tailwind.css";
import { Provider } from 'react-redux';
import { store } from '@/redux/store';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/config/react-query-client';
import { ToastProvider } from "@/components/common/notification/ToastProvider";

import { ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import "dayjs/locale/vi";

// Bỏ qua các cảnh báo không cần thiết từ thư viện thứ 3 (như @ant-design/pro-components)
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  if (typeof args[0] === 'string' && (args[0].includes('maskStyle is deprecated') || args[0].includes('bodyStyle is deprecated'))) return;
  originalWarn(...args);
};

const originalError = console.error;
console.error = (...args: any[]) => {
  if (typeof args[0] === 'string' && (args[0].includes('maskStyle is deprecated') || args[0].includes('bodyStyle is deprecated'))) return;
  originalError(...args);
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider locale={viVN}>
          <App />
          <ToastProvider />
        </ConfigProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>,
);

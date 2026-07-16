import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import '@ant-design/v5-patch-for-react-19';
import App from './App';
import "./styles/tailwind.css";
import { Provider } from 'react-redux';
import { store } from '@/redux/store';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/config/react-query-client';
import { ToastProvider } from "@/components/common/notification/ToastProvider";

import { ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import "dayjs/locale/vi";

const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() => import('@tanstack/react-query-devtools').then((module) => ({ default: module.ReactQueryDevtools })))
  : null;

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider locale={viVN}>
          <App />
          <ToastProvider />
        </ConfigProvider>
        {ReactQueryDevtools && (
          <Suspense fallback={null}>
            <ReactQueryDevtools initialIsOpen={false} />
          </Suspense>
        )}
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>,
);

import { fetchBaseQuery, createApi } from '@reduxjs/toolkit/query/react';
import { Mutex } from 'async-mutex';
import { store } from '@/redux/store';
import { setRefreshTokenAction } from '@/redux/slice/accountSlide';

//  Giống như axios interceptor, Mutex giúp ngăn chặn việc gọi refresh token nhiều lần cùng lúc.
const mutex = new Mutex();

/**
 * baseQuery = fetchBaseQuery()
 * Tương tự như axios instance trong axios-customize.ts
 * Đây là nơi định nghĩa base URL, headers, credentials...
 */
const baseQuery = fetchBaseQuery({
    baseUrl: import.meta.env.VITE_BACKEND_URL,  // tương đương instance.baseURL trong axios
    credentials: 'include',                      // gửi cookie (nếu backend yêu cầu)

    /**
     *  prepareHeaders = interceptor.request
     * => gắn token, header mặc định vào mỗi request
     */
    prepareHeaders: (headers) => {
        const token = localStorage.getItem('access_token'); // tương đương chỗ axios interceptor lấy token
        if (token) headers.set('Authorization', `Bearer ${token}`);
        headers.set('Accept', 'application/json');
        headers.set('Content-Type', 'application/json; charset=utf-8');
        return headers;
    },
});

/**
 *  baseQueryWithReauth = interceptor.response
 * => đây là phần thay thế axios interceptor response
 * => tự động refresh token nếu 401
 */
const baseQueryWithReauth: typeof baseQuery = async (args, api, extraOptions) => {
    await mutex.waitForUnlock(); // chờ nếu đang refresh token

    //  Thực hiện request ban đầu
    let result = await baseQuery(args, api, extraOptions);

    //  Nếu bị lỗi 401 (Unauthorized)
    if (result.error && result.error.status === 401) {
        //  Kiểm tra xem có đang refresh token chưa
        if (!mutex.isLocked()) {
            const release = await mutex.acquire(); // Khóa mutex để không refresh trùng
            try {
                //  Gọi API refresh token — thay cho axios.get('/api/v1/auth/refresh')
                const refreshResult = await baseQuery('/api/v1/auth/refresh', api, extraOptions);

                if (refreshResult.data) {
                    // Lưu token mới vào localStorage — tương tự chỗ axios interceptor set lại access_token
                    const access_token = (refreshResult.data as any).data?.access_token;
                    localStorage.setItem('access_token', access_token);

                    // Gửi lại request cũ — tương tự axios.request(error.config)
                    result = await baseQuery(args, api, extraOptions);
                } else {
                    // Nếu refresh thất bại thì dispatch action logout
                    store.dispatch(
                        setRefreshTokenAction({
                            status: true,
                            message: 'Vui lòng đăng nhập lại',
                        })
                    );
                }
            } finally {
                release(); //  Mở khóa mutex để request khác được tiếp tục
            }
        } else {
            // Nếu đang refresh token, chờ xong rồi gửi lại request
            await mutex.waitForUnlock();
            result = await baseQuery(args, api, extraOptions);
        }
    }

    // Trả về kết quả cuối cùng (data hoặc error)
    return result;
};

/**
 *  baseApi = createApi()
 * => tương đương việc tạo instance axios + các endpoints (API)
 * => RTK Query sẽ tự động sinh hook: useGet..., useCreate..., useDelete...
 */
export const baseApi = createApi({
    baseQuery: baseQueryWithReauth, // dùng "interceptor" tự viết ở trên
    endpoints: () => ({}),          // các API cụ thể sẽ inject sau
    tagTypes: ['User', 'Role', 'Permission', 'Company', 'Job'], //  RTK Query dùng tag để refetch
});

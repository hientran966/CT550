import axios from "axios";
import { notify } from "../plugins/message";

let isLoggingOut = false;

const commonConfig = {
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

export default (baseURL) => {
  const instance = axios.create({
    baseURL,
    ...commonConfig,
  });

  /* =====================
     Request interceptor
  ===================== */
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  /* =====================
     Response interceptor
  ===================== */
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const response = error.response;
      const status = response?.status;
      const messageFromBE = response?.data?.message;

      /* ===== Network error ===== */
      if (!response) {
        notify({
          title: "Lỗi kết nối",
          message: "Không thể kết nối tới máy chủ",
        });
        return Promise.reject(error);
      }

      /* ===== 401 ===== */
      if (status === 401 && !isLoggingOut) {
        isLoggingOut = true;

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        notify({
          title: "Phiên đăng nhập hết hạn",
          message: messageFromBE || "Vui lòng đăng nhập lại",
          type: "warning",
        });

        window.dispatchEvent(new Event("auth-changed"));

        setTimeout(() => {
          isLoggingOut = false;
        }, 1000);
      }

      /* ===== 403 ===== */
      else if (status === 403) {
        notify({
          title: "Không có quyền truy cập",
          message:
            messageFromBE ||
            "Bạn không có quyền thực hiện hành động này",
        });

        window.dispatchEvent(new Event("forbidden"));
      }

      /* ===== 422 Validation ===== */
      else if (status === 422) {
        notify({
          title: "Dữ liệu không hợp lệ",
          message: messageFromBE || "Vui lòng kiểm tra lại dữ liệu",
        });
      }

      /* ===== Other errors ===== */
      else {
        notify({
          title: "Lỗi",
          message: messageFromBE || "Đã xảy ra lỗi hệ thống",
        });
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

import api from "./api";

const URL = "/api/thong-ke";

const thongKeService = {
  getAll: async () => {
    const response = await api.get(URL);
    return response.data;
  },
};

export default thongKeService;

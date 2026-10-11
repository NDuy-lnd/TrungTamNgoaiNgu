
import api from "./api";

const URL = "/api/hoc-vien";

const hocVienService = {
  getAll: async (params) => {
    const response = await api.get(URL, { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`${URL}/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post(URL, data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`${URL}/${id}`, data);
    return response.data;
  },

  changeStatus: async (id, trang_thai) => {
    const response = await api.patch(
      `${URL}/${id}/trang-thai`,
      { trang_thai }
    );
    return response.data;
  },
};

export default hocVienService;

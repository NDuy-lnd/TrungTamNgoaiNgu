
import api from "./api";

const URL = "/api/lich-hoc";

const lichHocService = {
  getAll: async () =>
    (await api.get(URL)).data,

  getOptions: async () =>
    (await api.get(`${URL}/options`)).data,

  getById: async (id) =>
    (await api.get(`${URL}/${id}`)).data,

  create: async (data) =>
    (await api.post(URL, data)).data,

  update: async (id, data) =>
    (await api.put(`${URL}/${id}`, data)).data,

  delete: async (id) =>
    (await api.delete(`${URL}/${id}`)).data,
};

export default lichHocService;

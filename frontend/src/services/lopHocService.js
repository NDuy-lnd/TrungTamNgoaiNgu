
import api from "./api";

const URL = "/api/lop-hoc";

const lopHocService = {
  getAll: async (params) =>
    (await api.get(URL, { params })).data,

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

  getStudents: async (id) =>
    (await api.get(`${URL}/${id}/hoc-vien`)).data,

  saveStudents: async (id, studentIds) =>
    (
      await api.put(`${URL}/${id}/hoc-vien`, {
        ma_hoc_vien: studentIds,
      })
    ).data,
};

export default lopHocService;

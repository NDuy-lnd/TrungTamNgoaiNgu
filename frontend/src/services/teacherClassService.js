
import api from "./api";

const URL = "/api/teacher/classes";

const teacherClassService = {
  getAll: async () => {
    const response = await api.get(URL);
    return response.data;
  },

  getById: async (classId) => {
    const response = await api.get(`${URL}/${classId}`);
    return response.data;
  },
};

export default teacherClassService;

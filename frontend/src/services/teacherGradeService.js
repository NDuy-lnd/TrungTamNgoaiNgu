
import api from "./api";

const URL = "/api/teacher/grades";

const teacherGradeService = {
  getClasses: async () => {
    const response = await api.get(`${URL}/classes`);
    return response.data;
  },

  getGrades: async (classId) => {
    const response = await api.get(`${URL}/${classId}`);
    return response.data;
  },

  saveGrades: async (classId, records) => {
    const response = await api.put(`${URL}/${classId}`, {
      records,
    });
    return response.data;
  },
};

export default teacherGradeService;

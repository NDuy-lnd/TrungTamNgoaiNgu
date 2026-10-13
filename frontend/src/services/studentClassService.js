
import api from "./api";

const studentClassService = {
  getAll: async () => {
    const response = await api.get("/api/student/classes");
    return response.data;
  },

  getById: async (classId) => {
    const response = await api.get(
      `/api/student/classes/${classId}`
    );

    return response.data;
  },
};

export default studentClassService;


import api from "./api";

const studentGradeService = {
  getGrades: async () => {
    const response = await api.get(
      "/api/student/grades"
    );

    return response.data;
  },
};

export default studentGradeService;

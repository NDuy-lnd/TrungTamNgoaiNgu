
import api from "./api";

const URL = "/api/teacher/schedule";

const teacherScheduleService = {
  getAll: async () => {
    const response = await api.get(URL);
    return response.data;
  },
};

export default teacherScheduleService;

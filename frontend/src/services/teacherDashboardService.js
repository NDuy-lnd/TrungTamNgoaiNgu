
import api from "./api";

const teacherDashboardService = {
  getOverview: async () => {
    const response = await api.get(
      "/api/teacher/dashboard"
    );

    return response.data;
  },
};

export default teacherDashboardService;

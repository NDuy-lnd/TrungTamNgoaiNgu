
import api from "./api";

const studentDashboardService = {
  getOverview: async () => {
    const response = await api.get("/api/student/dashboard");
    return response.data;
  },
};

export default studentDashboardService;


import api from "./api";

const adminDashboardService = {
  getOverview: async () => {
    const response = await api.get("/api/admin/dashboard");
    return response.data;
  },
};

export default adminDashboardService;

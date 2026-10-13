
import api from "./api";

const studentScheduleService = {
  getSchedule: async () => {
    const response = await api.get(
      "/api/student/schedule"
    );

    return response.data;
  },
};

export default studentScheduleService;

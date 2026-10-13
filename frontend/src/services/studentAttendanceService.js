
import api from "./api";

const studentAttendanceService = {
  getHistory: async () => {
    const response = await api.get(
      "/api/student/attendance"
    );

    return response.data;
  },
};

export default studentAttendanceService;


import api from "./api";

const URL = "/api/teacher/attendance";

const teacherAttendanceService = {
  getClasses: async () => {
    const response = await api.get(`${URL}/classes`);
    return response.data;
  },

  getAttendance: async (classId, date) => {
    const response = await api.get(`${URL}/${classId}`, {
      params: { ngay_hoc: date },
    });
    return response.data;
  },

  saveAttendance: async (classId, date, records) => {
    const response = await api.put(`${URL}/${classId}`, {
      ngay_hoc: date,
      records,
    });
    return response.data;
  },
};

export default teacherAttendanceService;


import api from "./api";

const studentDocumentService = {
  getDocuments: async () => {
    const response = await api.get(
      "/api/student/documents"
    );

    return response.data;
  },
};

export default studentDocumentService;

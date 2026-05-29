export type UserRowPayload = {
  cmplUser: {
    cmplUserId: number;
    cmplUserName: string;
    empId: string | null;
    mailId: string;
    mobNo: string;
    deptId: number;
  };
  user: {
    userId: number;
    role: string;
    location: string;
  };
  department: {
    deptId: number;
    deptName: string | null;
  };
  hod: {
    hodId: number;
    name: string;
  } | null;
};
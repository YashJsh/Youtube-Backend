interface RegisterUserBody {
    fullName: string;
    email: string;
    username: string;
    password: string;
  }
  
  interface LoginUserBody {
    email?: string;
    username?: string;
    password: string;
  }
  
  interface ChangePasswordBody {
    oldPassword: string;
    newPassword: string;
  }
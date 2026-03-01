import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      hospitalId?: string; // Optional for SuperAdmin
      hospitalName?: string; // Optional for SuperAdmin
      hospitalCode?: string; // Optional for SuperAdmin
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    hospitalId?: string; // Optional for SuperAdmin
    hospitalName?: string; // Optional for SuperAdmin
    hospitalCode?: string; // Optional for SuperAdmin
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    hospitalId?: string; // Optional for SuperAdmin
    hospitalName?: string; // Optional for SuperAdmin
    hospitalCode?: string; // Optional for SuperAdmin
  }
}

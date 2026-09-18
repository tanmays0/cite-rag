import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    isGuest?: boolean;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      isGuest?: boolean;
      name?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isGuest?: boolean;
  }
}

import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const DJANGO_API_URL =
  process.env.DJANGO_API_URL || "http://localhost:8000/api/v1/hospital-dashboard";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Invalid credentials");
          }

          console.log("🔍 Attempting login for:", credentials.email);

          // Call Django auth endpoint
          const res = await fetch(`${DJANGO_API_URL}/auth/login/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            console.log("❌ Auth failed:", err.error || res.statusText);
            throw new Error(err.error || "Invalid credentials");
          }

          const user = await res.json();
          console.log("✅ Login successful:", user.email, "Role:", user.role);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            hospitalId: user.hospitalId,
            hospitalName: user.hospitalName,
            hospitalCode: user.hospitalCode,
          };
        } catch (error) {
          console.error("❌ Auth error:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.hospitalId = user.hospitalId;
        token.hospitalCode = user.hospitalCode;
        token.hospitalName = user.hospitalName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.hospitalId = token.hospitalId as string;
        session.user.hospitalCode = token.hospitalCode as string;
        session.user.hospitalName = token.hospitalName as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

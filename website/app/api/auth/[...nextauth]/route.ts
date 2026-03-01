import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions ={
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
            console.log("❌ Missing credentials");
            throw new Error("Invalid credentials");
          }

          console.log("🔍 Attempting login for:", credentials.email);

          // Hardcoded SuperAdmin check
          if (credentials.email.toLowerCase() === "superadmin@doklink.com" && credentials.password === "Super@123") {
            console.log("✅ Hardcoded SuperAdmin login successful");
            return {
              id: "superadmin-001",
              email: "superadmin@doklink.com",
              name: "Super Administrator",
              role: "SuperAdmin",
            };
          }

          const db = await getDb();
          console.log("📊 Connected to database:", db.databaseName);
          
          const user = await db.collection("users").findOne({
            email: credentials.email.toLowerCase(),
          });

          if (!user) {
            console.log("❌ User not found in database:", db.databaseName);
            throw new Error("Invalid credentials or account inactive");
          }

          if (!user.isActive) {
            console.log("❌ User inactive");
            throw new Error("Invalid credentials or account inactive");
          }

          console.log("✅ User found:", user.email, "Role:", user.role);

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          if (!isPasswordValid) {
            console.log("❌ Invalid password");
            throw new Error("Invalid credentials");
          }

          console.log("✅ Password valid");

          // SuperAdmin doesn't have a hospital
          if (user.role === "SuperAdmin") {
            console.log("✅ Returning SuperAdmin user");
            return {
              id: user._id.toString(),
              email: user.email,
              name: user.name,
              role: user.role,
            };
          }

          // Get hospital info for hospital users
          if (!user.hospitalId) {
            console.log("❌ No hospitalId for non-SuperAdmin user");
            throw new Error("Hospital not assigned to user");
          }

          const hospital = await db.collection("hospitals").findOne({
            _id: user.hospitalId,
            isActive: true,
          });

          if (!hospital) {
            console.log("❌ Hospital not found");
            throw new Error("Hospital not found or inactive");
          }

          console.log("✅ Returning hospital user");
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            hospitalId: user.hospitalId.toString(),
            hospitalName: hospital.name,
            hospitalCode: hospital.code,
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
        token.hospitalCode = user.hospitalCode; // Store hospital code for DB access
        token.hospitalName = user.hospitalName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.hospitalId = token.hospitalId as string;
        session.user.hospitalCode = token.hospitalCode as string; // Add hospital code to session
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

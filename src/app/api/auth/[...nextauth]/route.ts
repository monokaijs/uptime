import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        password: {label: "Password", type: "password"},
      },
      async authorize(credentials) {
        if (!credentials?.password) {
          throw new Error("Password is required");
        }

        // Compare with the admin password from environment variables
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminPassword) {
          throw new Error("Admin password not configured");
        }

        // Simple password comparison (in a real app, you'd use hashed passwords)
        if (credentials.password === adminPassword) {
          return {
            id: "admin",
            name: "Administrator",
            email: "admin@example.com",
          };
        }

        throw new Error("Invalid password");
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({token, user}) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({session, token}) {
      if (session.user) {
        (session.user as any).id = token.id as string;
      }
      return session;
    },
  },
});

export {handler as GET, handler as POST};

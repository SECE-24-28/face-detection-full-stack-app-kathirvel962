// app/api/graphql/route.ts
// Single GraphQL endpoint — handles auth and all face record operations.

import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, verifyToken } from "@/lib/auth";

// ─── Type Definitions ─────────────────────────────────────────────────────────
const typeDefs = `#graphql
  type User {
    id: Int!
    email: String!
  }

  # One detected face entry
  type FaceRecord {
    id:         Int!
    personName: String!
    imageUrl:   String!
    confidence: Float!
    detectedAt: String!
    status:     String!
  }

  type AuthPayload {
    token: String!
    user:  User!
  }

  type Query {
    # Get all face records (auth required)
    faceRecords: [FaceRecord!]!
    # Get a single face record by id
    faceRecord(id: Int!): FaceRecord
  }

  type Mutation {
    # Create a new admin account
    register(email: String!, password: String!): AuthPayload!
    # Login and receive JWT
    login(email: String!, password: String!): AuthPayload!

    # Add a new face detection record
    addFaceRecord(
      personName: String!
      imageUrl:   String!
      confidence: Float
      status:     String
    ): FaceRecord!

    # Update an existing record (e.g. after re-running detection)
    updateFaceRecord(
      id:         Int!
      personName: String
      imageUrl:   String
      confidence: Float
      status:     String
    ): FaceRecord!

    # Remove a face record
    deleteFaceRecord(id: Int!): Boolean!
  }
`;

// ─── Context ──────────────────────────────────────────────────────────────────
interface Context {
  userId: number | null;
}

// ─── Resolvers ────────────────────────────────────────────────────────────────
const resolvers = {
  Query: {
    // List all face records — protected
    faceRecords: (_: unknown, __: unknown, ctx: Context) => {
      if (!ctx.userId) throw new Error("Not authenticated");
      return prisma.faceRecord.findMany({ orderBy: { detectedAt: "desc" } });
    },

    // Single record — protected
    faceRecord: (_: unknown, { id }: { id: number }, ctx: Context) => {
      if (!ctx.userId) throw new Error("Not authenticated");
      return prisma.faceRecord.findUnique({ where: { id } });
    },
  },

  Mutation: {
    // Register admin user
    register: async (
      _: unknown,
      { email, password }: { email: string; password: string }
    ) => {
      const hashed = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({ data: { email, password: hashed } });
      return { token: signToken({ userId: user.id, email: user.email }), user };
    },

    // Login — returns JWT on success
    login: async (
      _: unknown,
      { email, password }: { email: string; password: string }
    ) => {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !(await bcrypt.compare(password, user.password)))
        throw new Error("Invalid credentials");
      return { token: signToken({ userId: user.id, email: user.email }), user };
    },

    // Add new face detection record — protected
    addFaceRecord: (
      _: unknown,
      args: { personName: string; imageUrl: string; confidence?: number; status?: string },
      ctx: Context
    ) => {
      if (!ctx.userId) throw new Error("Not authenticated");
      return prisma.faceRecord.create({ data: args });
    },

    // Update face record — protected
    updateFaceRecord: (
      _: unknown,
      { id, ...data }: { id: number; personName?: string; imageUrl?: string; confidence?: number; status?: string },
      ctx: Context
    ) => {
      if (!ctx.userId) throw new Error("Not authenticated");
      return prisma.faceRecord.update({ where: { id }, data });
    },

    // Delete face record — protected
    deleteFaceRecord: async (
      _: unknown,
      { id }: { id: number },
      ctx: Context
    ) => {
      if (!ctx.userId) throw new Error("Not authenticated");
      await prisma.faceRecord.delete({ where: { id } });
      return true;
    },
  },
};

// ─── Apollo Server ────────────────────────────────────────────────────────────
const server = new ApolloServer<Context>({ typeDefs, resolvers });

const handler = startServerAndCreateNextHandler<NextRequest, Context>(server, {
  // Read JWT from Authorization header on every request
  context: async (req) => {
    const auth = req.headers.get("authorization") ?? "";
    const token = auth.replace("Bearer ", "");
    const payload = token ? verifyToken(token) : null;
    return { userId: payload?.userId ?? null };
  },
});

export { handler as GET, handler as POST };

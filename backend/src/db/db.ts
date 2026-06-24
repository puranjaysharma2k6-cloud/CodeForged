// 1. Import Prisma Client (adjust the path if you use a custom output)
import { PrismaClient } from "../generated/prisma/client.js";

// PG adapter an adapter is a bridge between teh client and database driver , db driver communicates with your db opening tcp,websocket connection,
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!
});

//  Pass the adapter to PrismaClient prisma client is a query builder -> converts object code to sql queries
export const prisma = new PrismaClient({ adapter });
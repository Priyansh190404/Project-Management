import { PrismaClient } from "./app/generated/prisma/index.js";

const prisma = new PrismaClient();

const projects = await prisma.project.findMany();

console.log(JSON.stringify(projects, null, 2));

await prisma.$disconnect();
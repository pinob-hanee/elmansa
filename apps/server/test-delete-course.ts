import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const course = await prisma.course.findFirst();
  if (!course) return console.log("No course found");
  console.log("Trying to delete course:", course.id);
  try {
    await prisma.course.delete({ where: { id: course.id } });
    console.log("Success");
  } catch(e) {
    console.error("Error:", e);
  }
}
main().finally(() => prisma.$disconnect());

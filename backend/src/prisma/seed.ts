import prisma from "./client";

async function main() {
  console.log("No demo accounts are seeded; create users from the registration page.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

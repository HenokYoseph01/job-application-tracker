import { faker } from "@faker-js/faker";
import { Status, WorkMode } from "../generated/prisma/client.js";
import { prisma } from "../src/lib/prisma.js";

faker.seed(20260517);

const statuses = [
  Status.PENDING,
  Status.APPLIED,
  Status.INTERVIEWING,
  Status.OFFER,
  Status.REJECTED,
  Status.WITHDRAWN,
];

const workModes = [WorkMode.REMOTE, WorkMode.HYBRID, WorkMode.ONSITE];
const shouldClearData = process.argv.includes("-d");

const clearData = async () => {
  await prisma.application.deleteMany();
  await prisma.user.deleteMany();
};

const createApplication = () => {
  const salaryMin = faker.number.int({ min: 60000, max: 120000 });

  return {
    companyName: faker.company.name(),
    jobTitle: faker.person.jobTitle(),
    jobUrl: faker.internet.url(),
    location: faker.location.city(),
    contactName: faker.person.fullName(),
    status: faker.helpers.arrayElement(statuses),
    applicationDate: faker.date.recent({ days: 30 }),
    deadline: faker.date.soon({ days: 45 }),
    notes: faker.lorem.sentence(),
    salaryMin,
    salaryMax: salaryMin + faker.number.int({ min: 10000, max: 50000 }),
    workMode: faker.helpers.arrayElement(workModes),
  };
};

const main = async () => {
  if (shouldClearData) {
    await clearData();
    console.log("Cleared existing seed data.");
    return;
  }

  const users = await Promise.all(
    Array.from({ length: 5 }, async (_, index) => {
      return prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet
            .email({ provider: "example.com" })
            .replace("@", `.${index}@`)
            .toLowerCase(),
          // passwordHash: "$2b$10$seeded.fake.password.hash.for.testing.only",
          applications: {
            create: Array.from({ length: 4 }, createApplication),
          },
        },
        include: {
          applications: true,
        },
      });
    }),
  );

  const applicationCount = users.reduce(
    (total, user) => total + user.applications.length,
    0,
  );

  console.log(
    `Seeded ${users.length} users and ${applicationCount} applications.`,
  );
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

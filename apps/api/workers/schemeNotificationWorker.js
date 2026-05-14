const cron = require("node-cron");
const prisma = require("../db/prisma");
const {
  computeEligibleSchemes,
} = require("../eligibility/eligibilityEngine");
const {
  sendEmail,
} = require("../notifications/emailService");

cron.schedule("0 */6 * * *", async () => {

  const users = await prisma.user.findMany();

  const schemes = await prisma.scheme.findMany({
    where: {
      isNew: true,
    },
  });

  for (const user of users) {

    const eligible = computeEligibleSchemes(
      user,
      schemes
    );

    if (eligible.length > 0) {

      await sendEmail(
        user.email,
        eligible
      );
    }
  }

  console.log("Notifications processed");
});

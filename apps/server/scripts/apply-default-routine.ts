/**
 * Re-applies the current DEFAULT_ROUTINE_TEMPLATE (apps/server/src/modules/routines/
 * defaultRoutineTemplate.ts) to a specific user's account. New signups already get the
 * latest template via onboarding — this script is for an existing account whose routine
 * was assigned before the template changed.
 *
 * The previous active routine is deactivated (not deleted), so workout history logged
 * against it stays intact.
 *
 * Usage (run against whichever DB DATABASE_URL points to — local or production):
 *   npm run db:apply-default-routine --workspace=apps/server -- --email you@example.com
 */
import { prisma } from "../src/lib/prisma.js";
import { assignDefaultRoutineForUser } from "../src/modules/routines/routines.service.js";

async function main() {
  const emailFlagIndex = process.argv.indexOf("--email");
  const email = emailFlagIndex !== -1 ? process.argv[emailFlagIndex + 1] : undefined;
  if (!email) {
    throw new Error("Usage: --email you@example.com");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error(`No user found with email ${email}`);
  }

  const deactivated = await prisma.routine.updateMany({
    where: { userId: user.id, isActive: true },
    data: { isActive: false },
  });
  console.log(`Deactivated ${deactivated.count} previous routine(s) for ${email}.`);

  const routine = await assignDefaultRoutineForUser(user.id);
  const exerciseCount = routine.days.reduce((sum, d) => sum + d.exercises.length, 0);
  console.log(
    `Created routine "${routine.name}" (${routine.id}) with ${routine.days.length} days / ${exerciseCount} exercises.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

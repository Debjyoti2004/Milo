import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { app } from "../app.js";
import { prisma } from "../lib/prisma.js";

const email = `integration-${Date.now()}@example.com`;
const agent = request.agent(app);

describe("signup -> onboarding -> default routine -> partial set logging", () => {
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
  });

  it("signs up and gets an authenticated session", async () => {
    const res = await agent
      .post("/api/auth/signup")
      .send({ name: "Integration Test", email, password: "password123" });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(email);
  });

  it("completes onboarding, computes targets, and assigns the default Mon-Sun routine", async () => {
    const res = await agent.post("/api/profile/onboarding").send({
      gender: "MALE",
      dateOfBirth: "1998-05-10",
      heightCm: 175,
      currentWeightKg: 70,
      activityLevel: "MODERATE",
      goal: "BUILD_MUSCLE",
      experienceLevel: "BEGINNER",
      trainingDaysPerWeek: 6,
    });
    expect(res.status).toBe(201);
    expect(res.body.profile.dailyCalorieTarget).toBeGreaterThan(0);

    const routineRes = await agent.get("/api/routines/active");
    expect(routineRes.status).toBe(200);
    const days = routineRes.body.routine.days;
    expect(days).toHaveLength(7);

    const monday = days.find((d: { dayOfWeek: string }) => d.dayOfWeek === "MON");
    expect(monday.label).toBe("Push A — Chest");
    expect(monday.exercises).toHaveLength(8);
    expect(monday.exercises[0].exercise.name).toBe("Barbell Bench Press - Medium Grip");
    expect(monday.exercises[0].targetSets).toBe(4);
  });

  it("logs fewer sets than the target and reports PARTIAL without blocking the save", async () => {
    const routineRes = await agent.get("/api/routines/active");
    const monday = routineRes.body.routine.days.find((d: { dayOfWeek: string }) => d.dayOfWeek === "MON");

    const startRes = await agent.post("/api/sessions/start").send({ routineDayId: monday.id });
    expect(startRes.status).toBe(201);
    const session = startRes.body.session;
    const benchPress = session.exercises[0];
    expect(benchPress.targetSets).toBe(4);

    await agent
      .post(`/api/sessions/exercises/${benchPress.id}/sets`)
      .send({ setNumber: 1, weightKg: 20, reps: 7 })
      .expect(201);
    await agent
      .post(`/api/sessions/exercises/${benchPress.id}/sets`)
      .send({ setNumber: 2, weightKg: 20, reps: 7 })
      .expect(201);

    const getRes = await agent.get(`/api/sessions/${session.id}`);
    const updatedBenchPress = getRes.body.session.exercises[0];
    expect(updatedBenchPress.sets).toHaveLength(2);
    expect(updatedBenchPress.status).toBe("PARTIAL");

    const completeRes = await agent.patch(`/api/sessions/${session.id}/complete`);
    expect(completeRes.status).toBe(200);
    expect(completeRes.body.session.completedAt).not.toBeNull();
  });
});

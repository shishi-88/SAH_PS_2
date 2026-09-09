import { describe, expect, it } from "vitest";
import { createDemoSnapshot } from "@/data/seed";
import { buildAssessSessionOrder, shuffle } from "./assessment-session";

describe("assessment session ordering", () => {
  const students = createDemoSnapshot().students;

  it("groups by class with Class 1 → 2 → 3 order", () => {
    const order = buildAssessSessionOrder(students);
    expect(order.groups.map((g) => g.grade)).toEqual([1, 2, 3]);
  });

  it("never mixes students across classes", () => {
    const order = buildAssessSessionOrder(students);
    for (const group of order.groups) {
      for (const s of group.students) {
        expect(s.grade).toBe(group.grade);
      }
    }
  });

  it("contains every student exactly once", () => {
    const order = buildAssessSessionOrder(students);
    expect(order.all).toHaveLength(students.length);
    expect(new Set(order.all.map((s) => s.id)).size).toBe(students.length);
  });

  it("returns a stable order for one session (never reshuffles on access)", () => {
    const order = buildAssessSessionOrder(students, () => 0.42);
    const first = order.all.map((s) => s.id);
    // Same session value — repeated reads stay identical.
    expect(order.all.map((s) => s.id)).toEqual(first);
    // A fresh session built with the same rng is deterministic, but the
    // session itself never changes while it is held.
    const again = buildAssessSessionOrder(students, () => 0.42);
    expect(again.all.map((s) => s.id)).toEqual(first);
  });

  it("shuffles within each class once when the session is created", () => {
    const class1 = students.filter((s) => s.grade === 1);
    const order = buildAssessSessionOrder(students, () => 0.1);
    const group1 = order.groups.find((g) => g.grade === 1)!;
    expect(group1.students).toHaveLength(class1.length);
    // rng = 0.1 forces a non-identity permutation, so the session order
    // differs from the original roster order.
    expect(group1.students.map((s) => s.id)).not.toEqual(class1.map((s) => s.id));
  });

  it("preserves every student of the class when shuffled", () => {
    const order = buildAssessSessionOrder(students, () => 0.1);
    for (const group of order.groups) {
      const expected = new Set(
        students.filter((s) => s.grade === group.grade).map((s) => s.id),
      );
      const actual = new Set(group.students.map((s) => s.id));
      expect(actual).toEqual(expected);
    }
  });

  it("shuffle is a pure function that never mutates its input", () => {
    const input = [1, 2, 3, 4, 5];
    const copy = [...input];
    shuffle(input, () => 0.1);
    expect(input).toEqual(copy);
    expect(shuffle(copy, () => 0.1)).not.toEqual(copy);
  });
});
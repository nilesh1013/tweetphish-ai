import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("Analytics Stats", () => {
  it("returns analytics statistics", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.analytics.getStats();

    expect(stats).toBeDefined();
    expect(typeof stats?.totalTweets).toBe("number");
    expect(typeof stats?.totalSearches).toBe("number");
    expect(typeof stats?.threatsDetected).toBe("number");
    expect(typeof stats?.phishingDetected).toBe("number");
  });
});

describe("Tweet Search", () => {
  it("accepts semantic search query", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // This will return empty results since we haven't populated the database yet
    // but it tests that the endpoint works
    const results = await caller.tweets.semanticSearch({ 
      query: "test query",
      limit: 10 
    });

    expect(Array.isArray(results)).toBe(true);
  });

  it("accepts keyword search query", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const results = await caller.tweets.searchByKeyword({ 
      query: "test" 
    });

    expect(Array.isArray(results)).toBe(true);
  });

  it("accepts compare search query", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const results = await caller.tweets.compareSearch({ 
      query: "test" 
    });

    expect(results).toBeDefined();
    expect(Array.isArray(results.semantic)).toBe(true);
    expect(Array.isArray(results.keyword)).toBe(true);
    expect(typeof results.semanticCount).toBe("number");
    expect(typeof results.keywordCount).toBe("number");
  });
});

describe("Search History", () => {
  it("returns search history", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const history = await caller.analytics.getHistory({ limit: 10 });

    expect(Array.isArray(history)).toBe(true);
  });
});

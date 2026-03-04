import { act, render } from "@testing-library/react";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";

type ApiMock = ReturnType<typeof vi.fn> & {
  post: ReturnType<typeof vi.fn>;
  interceptors: {
    request: { use: ReturnType<typeof vi.fn> };
    response: { use: ReturnType<typeof vi.fn>; eject: ReturnType<typeof vi.fn> };
  };
};

let responseErrorHandler: ((error: any) => Promise<unknown>) | undefined;

const { apiMock } = vi.hoisted(() => {
  const mock = vi.fn() as ApiMock;
  mock.post = vi.fn();
  mock.interceptors = {
    request: { use: vi.fn() },
    response: {
      use: vi.fn((_ok: unknown, err: (error: any) => Promise<unknown>) => {
        responseErrorHandler = err;
        return 1;
      }),
      eject: vi.fn(),
    },
  };
  return { apiMock: mock };
});

vi.mock("../services/api", () => ({
  __esModule: true,
  default: apiMock,
}));

function buildJwt(payload: Record<string, unknown>) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

function AuthHarness(props: { onReady: (ctx: ReturnType<typeof useAuth>) => void }) {
  const ctx = useAuth();

  useEffect(() => {
    props.onReady(ctx);
  }, [ctx, props]);

  return null;
}

describe("AuthContext refresh flow", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
    responseErrorHandler = undefined;
  });

  it("refreshes token and retries original request on 401", async () => {
    const initialToken = buildJwt({ role: "ADMIN", salonId: "salon-1" });
    const refreshedToken = buildJwt({ role: "ADMIN", salonId: "salon-1" });

    apiMock.post.mockResolvedValueOnce({
      data: {
        access_token: refreshedToken,
        refresh_token: "refresh-new",
      },
    });
    apiMock.mockResolvedValueOnce({ data: { ok: true } });

    let authCtx: ReturnType<typeof useAuth> | null = null;

    render(
      <AuthProvider>
        <AuthHarness onReady={(ctx) => (authCtx = ctx)} />
      </AuthProvider>,
    );

    expect(authCtx).not.toBeNull();

    act(() => {
      authCtx!.login(initialToken, "refresh-old");
    });

    const originalRequest = { url: "/vision/upload", headers: {} as Record<string, string> };

    await act(async () => {
      await responseErrorHandler?.({
        response: { status: 401 },
        config: originalRequest,
      });
    });

    expect(apiMock.post).toHaveBeenCalledWith("/auth/refresh", {
      refresh_token: "refresh-old",
    });
    expect(apiMock).toHaveBeenCalledWith(
      expect.objectContaining({
        _retry: true,
        headers: expect.objectContaining({
          Authorization: `Bearer ${refreshedToken}`,
        }),
      }),
    );
    expect(localStorage.getItem("token")).toBe(refreshedToken);
    expect(localStorage.getItem("refresh_token")).toBe("refresh-new");
  });
});

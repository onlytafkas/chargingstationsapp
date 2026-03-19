import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@clerk/nextjs", () => ({
  SignInButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignUpButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Show: ({
    when,
    children,
  }: {
    when: "signed-in" | "signed-out";
    children: React.ReactNode;
  }) => (when === "signed-out" ? <>{children}</> : null),
  UserButton: () => <div>User</div>,
}));

import { Header } from "@/components/header";

describe("Header", () => {
  it("renders the app name with a smaller version label", () => {
    render(<Header versionLabel="v1.0.0" />);

    expect(
      screen.getByRole("heading", { name: /charging stations app v1\.0\.0/i })
    ).toBeInTheDocument();
    expect(screen.getByText("v1.0.0")).toHaveClass(
      "text-sm",
      "font-normal",
      "text-muted-foreground"
    );
  });
});
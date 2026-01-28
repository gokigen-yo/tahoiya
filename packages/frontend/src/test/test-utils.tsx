import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { type RenderOptions, render } from "@testing-library/react";
import type { ReactElement } from "react";

function AllTheProviders({ children }: { children: React.ReactNode }) {
  return <ChakraProvider value={defaultSystem}>{children}</ChakraProvider>;
}

function customRender(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

export * from "@testing-library/react";
export { customRender as render };

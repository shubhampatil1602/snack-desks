import { useEffect, useRef, useTransition } from "react";
import { create } from "zustand";

type OrderMutation = "placing" | "updating" | "cancelling";

// The order can be placed, updated or cancelled from the cart sheet, the order
// window's card and the repeat dialog. One shared flag keeps them all busy
// together, so a second click elsewhere can't fire another request.
const useOrderMutationStore = create<{
  pending: OrderMutation | null;
  setPending: (pending: OrderMutation | null) => void;
}>()((set) => ({
  pending: null,
  setPending: (pending) => set({ pending }),
}));

export function useOrderMutation() {
  const pending = useOrderMutationStore((state) => state.pending);
  const setPending = useOrderMutationStore((state) => state.setPending);
  const [isPending, startTransition] = useTransition();
  const owns = useRef(false);

  // the transition ends once router.refresh() has rendered the new order,
  // not when the action returns, so the buttons stay busy until then
  useEffect(() => {
    if (!isPending && owns.current) {
      owns.current = false;
      setPending(null);
    }
  }, [isPending, setPending]);

  // don't leave the others stuck if this one unmounts mid-request
  useEffect(
    () => () => {
      if (owns.current) setPending(null);
    },
    [setPending],
  );

  function run(kind: OrderMutation, action: () => Promise<void>) {
    if (useOrderMutationStore.getState().pending) return;
    owns.current = true;
    setPending(kind);
    startTransition(action);
  }

  return { pending, run };
}

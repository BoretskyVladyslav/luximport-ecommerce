export {}

type WayforpayWidgetInstance = {
    run: (
        options: Record<string, unknown>,
        onApproved: (response: unknown) => void,
        onDeclined: (response: unknown) => void,
        onPending: (response: unknown) => void
    ) => void
    closeit?: () => void
}

declare global {
    interface Window {
        Wayforpay: new () => WayforpayWidgetInstance
    }
}

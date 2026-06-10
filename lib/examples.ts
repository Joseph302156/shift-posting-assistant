// Sample requests, surfaced as one-click chips in the UI so a first-time
// visitor (e.g. a Traba recruiter) can see the product work immediately.
// They're written to exercise different reliability scenarios:
// strong post, missing-pay, below-market, and tight same-day overnight.

export interface Example {
  label: string;
  text: string;
}

export const EXAMPLES: Example[] = [
  {
    label: "Forklift · overnight · Dallas",
    text: "Need 12 forklift-certified workers for an overnight shift this Tuesday, 10pm to 6am, near the Dallas distribution center. Pay is $24/hr. Steel-toe boots and hi-vis required. Park in lot C and report to dock door 4.",
  },
  {
    label: "Pickers · pay missing",
    text: "Looking for 8 pickers and packers at our Newark fulfillment warehouse for tomorrow's day shift.",
  },
  {
    label: "Food production · GMP",
    text: "We need 20 food production line workers for our dairy plant in Tulare, GMP required, this weekend. $17/hr, hairnets and steel-toe boots needed.",
  },
  {
    label: "Loaders · same-day · low pay",
    text: "Need 6 loaders to unload freight today ASAP at the Memphis dock. $14/hr.",
  },
];

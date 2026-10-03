// Fixed, non-clinical follow-up prompts. Deterministic text — never AI-generated or AI-selected.
import type { BarrierLabel } from "./types";

export const HOUSEHOLD_PRIVACY_NOTICE =
  "Speak with her privately first. Do not discuss her referral with family members without her consent.";

export const FOLLOW_UP_ACTIONS: Record<BarrierLabel, string[]> = {
  access_cost: [
    "Ask what makes the journey difficult (distance, transport, cost)",
    "Check whether any local transport or support option is available",
    "Agree a new follow-up date",
    "Other / no action",
  ],
  household_constraint: [
    "Ask what support, if any, she would like",
    "Ask whether accompaniment would help",
    "Agree a new follow-up date",
    "Other / no action",
  ],
  fear_hesitancy: [
    "Ask what specifically worries her",
    "Offer a conversation with an appropriate or trusted health worker",
    "Record the concern for the next follow-up",
    "Other / no action",
  ],
  work_caregiving: [
    "Ask which days or times may be possible",
    "Ask whether work or care responsibilities affect when she can attend",
    "Agree a new follow-up date",
    "Other / no action",
  ],
  understanding_information: [
    "Confirm she knows where to go",
    "Confirm she knows when to go",
    "Use the programme’s approved information to explain why follow-up matters",
    "Other / no action",
  ],
};

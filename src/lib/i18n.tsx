// Centralised UI language layer (English | हिन्दी). One workflow; only labels change.
// Stored data is never translated or modified when the language changes.
import { useEffect, useSyncExternalStore } from "react";

export type Lang = "en" | "hi";
const KEY = "pahunchi-ui-lang";
let lang: Lang = "en";
const listeners = new Set<() => void>();

export function setLang(l: Lang) {
  lang = l;
  try { localStorage.setItem(KEY, l); } catch { /* ignore */ }
  if (typeof document !== "undefined") document.documentElement.lang = l;
  listeners.forEach((f) => f());
}

let loaded = false;
export function useLang(): Lang {
  const l = useSyncExternalStore((f) => { listeners.add(f); return () => listeners.delete(f); }, () => lang, () => "en" as Lang);
  useEffect(() => {
    if (loaded) return;
    loaded = true;
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === "hi" || saved === "en") setLang(saved);
    } catch { /* ignore */ }
  }, []);
  return l;
}

const D = {
  nav_home: ["Home", "होम"],
  nav_referrals: ["Referrals", "रेफरल"],
  nav_new: ["New Referral", "नया रेफरल"],
  nav_arrival: ["Confirm arrival", "आगमन पुष्टि"],
  nav_insights: ["Insights", "जानकारी"],
  tagline: ["Every referral deserves an answer.", "हर रेफरल को जवाब मिलना चाहिए।"],
  new_referral: ["New referral", "नया रेफरल"],
  needs_followup: ["Needs follow-up", "फॉलो-अप ज़रूरी"],
  due_soon: ["Due soon", "जल्द देय"],
  completed: ["Completed", "पूरा हुआ"],
  stored_offline: ["Stored offline", "ऑफ़लाइन सहेजा गया"],
  followup_queue: ["Follow-up queue", "फॉलो-अप सूची"],
  needs_attention: ["Needs attention", "ध्यान देने की ज़रूरत"],
  na_barrier: ["Patient-reported barrier", "मरीज़ द्वारा बताई गई बाधा"],
  na_missed: ["Missed expected visit / no response", "अपेक्षित विज़िट छूटी / कोई जवाब नहीं"],
  na_unconfirmed: ["Arrival still unconfirmed", "आगमन अभी पुष्ट नहीं"],
  na_note: ["Ordered by follow-up status and date — not by medical risk.", "फॉलो-अप स्थिति और तारीख के अनुसार — चिकित्सीय जोखिम के अनुसार नहीं।"],
  na_empty: ["Nothing needs attention right now.", "अभी किसी पर ध्यान देने की ज़रूरत नहीं।"],
  expected: ["Expected", "अपेक्षित"],
  confirm_manual: ["Confirm arrival manually", "आगमन की मैन्युअल पुष्टि करें"],
  manual_note: ["Records that the worker confirmed arrival outside Pahunchi. This does not verify treatment or diagnosis.", "दर्ज करता है कि कार्यकर्ता ने Pahunchi के बाहर आगमन की पुष्टि की। यह इलाज या निदान की पुष्टि नहीं करता।"],
  basic_phone: ["Basic Phone Access", "बेसिक फ़ोन एक्सेस"],
  basic_phone_sub: ["Simulation — future SMS gateway workflow", "सिमुलेशन — भविष्य का SMS गेटवे वर्कफ़्लो"],
  sim_sync: ["Simulated sync", "सिम्युलेटेड सिंक"],
  sim_sync_sub: ["Demonstration only — no server is contacted.", "केवल प्रदर्शन — किसी सर्वर से संपर्क नहीं होता।"],
  step_of: ["Step {n} of 2", "चरण {n} / 2"],
  referral_details: ["Referral details", "रेफरल विवरण"],
  barrier_note: ["Barrier note", "बाधा नोट"],
  patient_id: ["Patient ID", "मरीज़ ID"],
  referral_date: ["Referral date", "रेफरल तारीख"],
  followup_due: ["Follow-up due", "फॉलो-अप तारीख"],
  destination: ["Destination facility", "गंतव्य केंद्र"],
  facility_type: ["Facility type", "केंद्र का प्रकार"],
  ft_locked: ["Filled from Facility Finder — edit the destination to change it.", "केंद्र खोजक से भरा गया — बदलने के लिए गंतव्य संपादित करें।"],
  ft_choose: ["Choose facility type…", "केंद्र का प्रकार चुनें…"],
  department: ["Department / service", "विभाग / सेवा"],
  context: ["Referral note / context", "रेफरल नोट / संदर्भ"],
  continue: ["Continue", "आगे बढ़ें"],
  edit: ["Edit", "बदलें"],
  confirm_save: ["Confirm & save", "पुष्टि करें और सहेजें"],
  find_facility: ["Find a referral facility", "रेफरल केंद्र खोजें"],
  optional: ["(optional)", "(वैकल्पिक)"],
  health_area: ["Health area", "स्वास्थ्य क्षेत्र"],
  service_needed: ["Service needed", "आवश्यक सेवा"],
  choose: ["Choose…", "चुनें…"],
  suggested_option: ["Suggested option", "सुझाया गया विकल्प"],
  why_option: ["Why this option?", "यह विकल्प क्यों?"],
  why_not_closer: ["Why not the closer facility?", "नज़दीकी केंद्र क्यों नहीं?"],
  use_facility: ["Use this facility", "यह केंद्र चुनें"],
  chosen: ["Chosen — fills the form below", "चुना गया — नीचे फ़ॉर्म भरा गया"],
  unavailable_cannot: ["Currently unavailable — cannot be selected", "अभी उपलब्ध नहीं — चुना नहीं जा सकता"],
  appt_required: ["Appointment required", "अपॉइंटमेंट ज़रूरी"],
  appt_not_required: ["No appointment needed", "अपॉइंटमेंट ज़रूरी नहीं"],
  appt_contact: ["Contact facility", "केंद्र से संपर्क करें"],
  contact: ["Contact", "संपर्क"],
  back_referrals: ["Referrals", "रेफरल"],
  referral_journey: ["Referral journey", "रेफरल यात्रा"],
  journey_id: ["Journey ID", "यात्रा ID"],
  journey_note: ["Journey ID covers one referral/care journey only — not a lifetime patient ID.", "यात्रा ID केवल एक रेफरल यात्रा के लिए है — स्थायी मरीज़ ID नहीं।"],
  origin: ["Referred from", "कहाँ से रेफर"],
  print_referral: ["Print referral", "रेफरल प्रिंट करें"],
  what_happened: ["What happened to this referral?", "इस रेफरल का क्या हुआ?"],
  outcome_note: ["Operational outcome only. No diagnosis, treatment or clinical details are recorded. “Service completed” does not mean cured or treated successfully.", "केवल प्रक्रिया का परिणाम। निदान, इलाज या चिकित्सीय विवरण दर्ज नहीं होते। “सेवा पूरी” का अर्थ ठीक होना नहीं है।"],
  oc_service_completed: ["Service completed", "सेवा पूरी हुई"],
  oc_refer_onward: ["Refer onward", "आगे रेफर करें"],
  oc_service_unavailable: ["Service unavailable", "सेवा उपलब्ध नहीं"],
  oc_other: ["Other / follow-up needed", "अन्य / फॉलो-अप ज़रूरी"],
  onward_from: ["Onward referral from {code}", "{code} से आगे का रेफरल"],
  onward_note: ["Same journey, new referral code. Choose the service and destination; nothing is selected automatically.", "वही यात्रा, नया रेफरल कोड। सेवा और गंतव्य स्वयं चुनें; कुछ भी अपने आप नहीं चुना जाता।"],
  patient_barriers: ["Patient-reported barriers", "मरीज़ द्वारा बताई गई बाधाएँ"],
  st_referred: ["Referred", "रेफर किया गया"],
  st_due: ["Follow-up due", "फॉलो-अप देय"],
  st_not_completed: ["Not completed", "पूरा नहीं"],
  st_completed: ["Completed", "पूरा हुआ"],
  st_patient: ["Patient reports arrival", "मरीज़ ने आगमन बताया"],
  st_verified: ["Arrival verified", "आगमन सत्यापित"],
  st_worker: ["Worker-confirmed arrival", "कार्यकर्ता द्वारा पुष्ट आगमन"],
  arr_awaiting: ["Awaiting arrival confirmation", "आगमन की पुष्टि का इंतज़ार"],
  arr_patient: ["Patient-reported arrival", "मरीज़ द्वारा बताया आगमन"],
  arr_facility: ["Facility-verified arrival", "केंद्र द्वारा सत्यापित आगमन"],
  arr_worker: ["Worker-confirmed arrival", "कार्यकर्ता द्वारा पुष्ट आगमन"],
  more_tools: ["Demonstrations", "प्रदर्शन"],
} as const;

export type TKey = keyof typeof D;
export function translate(l: Lang, k: TKey, vars?: Record<string, string | number>): string {
  let s: string = D[k][l === "hi" ? 1 : 0];
  if (vars) for (const [n, v] of Object.entries(vars)) s = s.replace(`{${n}}`, String(v));
  return s;
}
export function useT() {
  const l = useLang();
  return (k: TKey, vars?: Record<string, string | number>) => translate(l, k, vars);
}

export function LangToggle() {
  const l = useLang();
  return (
    <div role="group" aria-label="Language" className="flex overflow-hidden rounded-full border border-input text-xs font-semibold">
      {(["en", "hi"] as const).map((x) => (
        <button key={x} type="button" aria-pressed={l === x} onClick={() => setLang(x)}
          className={`min-h-8 px-2.5 ${l === x ? "bg-primary text-primary-foreground" : "bg-card"}`}>
          {x === "en" ? "English" : "हिन्दी"}
        </button>
      ))}
    </div>
  );
}

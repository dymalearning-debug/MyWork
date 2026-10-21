import { describe, expect, it } from "vitest";

import { renderBillingEmail, SAMPLE_BILLING_EMAILS, type BillingEmailData } from "./templates";

const ORIGIN = "https://hellomywork.com";
const sample = (kind: string) => SAMPLE_BILLING_EMAILS.find((email) => email.kind === kind)!.data;

describe("the emails of the subscription", () => {
  it("welcome: the trial, the first payment, the card and the first steps", () => {
    const email = renderBillingEmail("welcome", sample("welcome"), ORIGIN);
    expect(email.subject).toBe("Bienvenue dans MyWork");
    expect(email.text).toContain("Bienvenue, Jeanne");
    expect(email.text).toContain("Formule : Annuelle · 50 € par an");
    expect(email.text).toContain("Fin de l'essai : mercredi 28 octobre 2026");
    expect(email.text).toContain("Premier prélèvement : 50 € le 28 octobre 2026");
    expect(email.text).toContain("Carte : Visa •••• 4242");
    expect(email.text).toContain("Partagez votre adresse : hellomywork.com/jeanne-martin");
    expect(email.html).toContain(`href="${ORIGIN}/app"`);
  });

  it("welcome without a trial: the next payment", () => {
    const data: BillingEmailData = { ...sample("welcome"), trialEnd: null, currentPeriodEnd: "2027-10-21T10:00:00Z" };
    const email = renderBillingEmail("welcome", data, ORIGIN);
    expect(email.text).toContain("Votre abonnement est actif.");
    expect(email.text).toContain("Prochain prélèvement : 50 € le 21 octobre 2027");
    expect(email.text).not.toContain("Fin de l'essai");
  });

  it("end of the trial, 3 days before: the date and the amount, and how to cancel", () => {
    const email = renderBillingEmail("trial_ending", sample("trial_ending"), ORIGIN);
    expect(email.subject).toBe("Votre essai se termine le 28 octobre");
    expect(email.text).toContain("Plus que 3 jours d'essai");
    expect(email.text).toContain("votre abonnement démarre mercredi 28 octobre. Nous vous prélèverons alors 50 € pour un an.");
    expect(email.text).toContain("résiliez avant le 28 octobre");
    expect(email.html).toContain(`href="${ORIGIN}/app?settings=billing"`);
  });

  it("goodbye: the end of the access, the bookings cancelled then, the data kept 90 days", () => {
    const email = renderBillingEmail("goodbye", sample("goodbye"), ORIGIN);
    expect(email.subject).toBe("Votre abonnement est résilié");
    expect(email.text).toContain("Au revoir, Jeanne");
    expect(email.text).toContain("Fin de l'accès : jeudi 28 octobre 2027");
    expect(email.text).toContain("Rendez-vous à venir : 3, annulés à cette date");
    expect(email.text).toContain("Vos données : gardées jusqu'au 26 janvier 2028");
    expect(email.text).toContain("fin de la période payée");
  });

  it("goodbye during the trial: nothing will be taken", () => {
    const data: BillingEmailData = { ...sample("welcome"), cancelAt: "2026-10-28T10:00:00Z" };
    const email = renderBillingEmail("goodbye", data, ORIGIN);
    expect(email.text).toContain("Rien ne vous sera prélevé, et votre accès reste ouvert jusqu'à la fin de l'essai.");
    expect(email.text).not.toContain("Rendez-vous à venir");
  });

  it("ended: the space is paused, the data kept until a date", () => {
    const email = renderBillingEmail("ended", sample("ended"), ORIGIN);
    expect(email.subject).toBe("Votre espace MyWork est en pause");
    expect(email.text).toContain("Vos 3 rendez-vous à venir ont été annulés");
    expect(email.text).toContain("Vos données sont gardées jusqu'au mercredi 26 janvier 2028");
    expect(email.html).toContain(`href="${ORIGIN}/app/subscribe"`);
  });

  it("escapes what comes from the account", () => {
    const data: BillingEmailData = { ...sample("welcome"), firstName: "<b>Jeanne</b>" };
    expect(renderBillingEmail("welcome", data, ORIGIN).html).toContain("Bienvenue, &lt;b&gt;Jeanne&lt;/b&gt;");
  });
});

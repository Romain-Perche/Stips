/** « 2026-09-02 » → « 2 sept. ». En UTC : une date seule se lit à minuit
    UTC, et un fuseau à l'ouest de Greenwich afficherait sinon la veille. */
export const dateCourte = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });

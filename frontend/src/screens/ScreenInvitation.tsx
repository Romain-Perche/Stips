/* ══════════════════════════════════════════════════════════════════════
   ÉCRAN D'ENTRÉE — pas un onglet · design 5a2
   L'invitation nominative envoyée par le parrain. C'est la première chose
   qu'un futur membre voit, avant même d'avoir un compte.

   Le parrainage en 3 temps (5a) a été retiré : accepter l'invitation mène
   directement à l'app.
   ══════════════════════════════════════════════════════════════════════ */

import { C, DATA } from '@stips/core';
import { F } from '../tokens';
import { Mono, Avatar, Card, Screen } from '../atoms';

export default function ScreenInvitation({ onAccepter }: { onAccepter: () => void }) {
  const inv = DATA.invitation;
  return (
    <Screen>
      <div className="body">
        <div style={{ padding: '26px 22px 140px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          <div>
            <Mono>INVITATION NOMINATIVE · VALABLE 7 JOURS</Mono>
            <div style={{
              font: `400 34px/1.08 ${F.serif}`, color: C.ink,
              marginTop: 10, textWrap: 'pretty',
            }}>{inv.parrain} te fait entrer dans Stips, {inv.prenom}.</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar size={52} />
            <div>
              <div style={{ font: `600 15px ${F.ui}`, color: C.ink }}>{inv.parrain}</div>
              <div style={{ font: `400 12px ${F.ui}`, color: C.muted }}>{inv.role}</div>
            </div>
          </div>

          <Card>
            <Mono>CE QU'IL/ELLE A DÉJÀ ÉCRIT SUR TOI</Mono>
            <div style={{ marginTop: 8, font: `400 26px/1.15 ${F.serif}`, color: C.ink }}>{inv.qualificatif}</div>
            <div style={{
              marginTop: 10, font: `italic 400 17px/1.45 ${F.serif}`,
              color: C.ink2, textWrap: 'pretty',
            }}>{inv.reco}</div>
            <div style={{
              marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(0,0,0,.08)',
              font: `400 12px ${F.ui}`, color: C.muted2,
            }}>{inv.signee}</div>
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            <Mono>CE QUE ÇA T'OUVRE</Mono>
            {inv.avantages.map((a, i) => (
              <div key={a} style={{ display: 'flex', gap: 11, alignItems: 'baseline' }}>
                <span style={{ font: `500 12px ${F.mono}`, color: C.ink }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{ font: `400 14px/1.4 ${F.ui}`, color: C.ink3 }}>{a}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* CTA collé en bas */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '16px 22px 22px', background: C.bg,
        borderTop: '1px solid rgba(0,0,0,.08)',
      }}>
        <div onClick={onAccepter} style={{
          padding: 15, borderRadius: 99, background: C.ink, color: C.cream,
          font: `600 15px ${F.ui}`, textAlign: 'center', cursor: 'pointer',
        }}>Accepter l'invitation</div>
        <div style={{ textAlign: 'center', font: `400 12px ${F.ui}`, color: C.muted, marginTop: 10 }}>
          100 € / an, tout compris · <span style={{ color: C.ink, textDecoration: 'underline', cursor: 'pointer' }}>C'est quoi Stips ?</span>
        </div>
      </div>
    </Screen>
  );
}

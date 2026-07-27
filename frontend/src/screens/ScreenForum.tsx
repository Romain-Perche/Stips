/* ══════════════════════════════════════════════════════════════════════
   ONGLET « Forum » — candidat · design 4b
   Fils de discussion votés, façon Reddit.
   ══════════════════════════════════════════════════════════════════════ */

import { useMemo, useState, type ReactNode } from 'react';
import { C, F } from '../tokens';
import { Mono, Card, ScreenHead, Pills, Screen } from '../atoms';
import { DATA } from '../data';
import type { Fil, TabScreen } from '../types';

function ScreenForum({ nav }: { nav: ReactNode }) {
  const [filtre, setFiltre] = useState('Populaire');
  const [votes, setVotes] = useState<Record<string, number>>(() =>
    Object.fromEntries(DATA.fils.map(f => [f.id, f.votes])));

  const liste = useMemo(() => {
    const l = [...DATA.fils];
    if (filtre === 'Récent')  return l.sort((a, b) => a.heures - b.heures);
    if (filtre === 'Mes fils') return [];
    return l.sort((a, b) => votes[b.id] - votes[a.id]);
  }, [filtre, votes]);

  const voter = (id: string, n: number) => setVotes(v => ({ ...v, [id]: v[id] + n }));

  return (
    <Screen nav={nav}>
      <ScreenHead titre="Le forum" />
      <Pills items={['Populaire', 'Récent', 'Mes fils', '⚙']} active={filtre}
        onChange={p => p !== '⚙' && setFiltre(p)} />

      <div className="body">
        <div style={{ padding: '14px 22px 96px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {liste.map(f => (
            <FilCard key={f.id} f={f} votes={votes[f.id]} onVote={n => voter(f.id, n)} />
          ))}
          {liste.length === 0 && <Mono>TU N'AS PAS ENCORE OUVERT DE FIL</Mono>}
        </div>
      </div>

      {/* Nouveau fil */}
      <div style={{
        position: 'absolute', bottom: 88, right: 22, width: 52, height: 52,
        borderRadius: '50%', background: C.ink, color: C.cream,
        display: 'grid', placeItems: 'center', font: `300 26px ${F.ui}`, cursor: 'pointer',
      }}>+</div>
    </Screen>
  );
}

function FilCard({ f, votes, onVote }: { f: Fil; votes: number; onVote: (n: number) => void }) {
  const d = f.dark;
  return (
    <Card dark={d} radius={14} pad={14} style={{ display: 'flex', gap: 14 }}>
      <div style={{
        flex: 'none', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 3, paddingTop: 2,
      }}>
        <div onClick={() => onVote(1)} style={{ font: `400 15px ${F.ui}`, color: d ? C.cream : C.ink, cursor: 'pointer' }}>▲</div>
        <div style={{ font: `600 14px ${F.mono}`, color: d ? C.cream : C.ink }}>{votes}</div>
        <div onClick={() => onVote(-1)} style={{ font: `400 15px ${F.ui}`, color: d ? C.creamFai : C.faint, cursor: 'pointer' }}>▼</div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: `500 11px ${F.mono}`, color: d ? C.creamFai : C.muted2 }}>{f.meta}</div>
        <div style={{
          font: `600 16px/1.3 ${F.ui}`, color: d ? C.cream : C.ink,
          marginTop: 6, textWrap: 'pretty',
        }}>{f.titre}</div>

        {f.extrait && (
          <div style={{
            font: `400 13px/1.4 ${F.ui}`, color: C.muted, marginTop: 6,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{f.extrait}</div>
        )}

        {f.piece && (
          <div style={{
            marginTop: 10, height: 96, borderRadius: 9,
            background: 'repeating-linear-gradient(45deg,#efebdf,#efebdf 6px,#f6f3ea 6px,#f6f3ea 12px)',
            display: 'grid', placeItems: 'center',
            font: `500 11px ${F.mono}`, color: C.muted2,
          }}>{f.piece}</div>
        )}

        <div style={{
          display: 'flex', gap: 14, marginTop: 10,
          font: `500 12px ${F.ui}`, color: d ? C.creamMut : C.muted,
        }}>
          <span>💬 {f.reponses} réponses</span>
        </div>
      </div>
    </Card>
  );
}

(ScreenForum as TabScreen).tab = { id: 'forum', label: 'Forum' };

export default ScreenForum as TabScreen;

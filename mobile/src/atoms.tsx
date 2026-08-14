/* ══════════════════════════════════════════════════════════════════════
   ATOMES — les briques réutilisées par tous les écrans.

   Portage React Native du atoms.tsx web : mêmes noms et mêmes props côté
   appelant quand c'est possible, mais primitives RN (View/Text/Pressable)
   à la place des div/span, et remplacement des interactions "souris"
   (:hover) par un état pressé — voir Stk.
   ══════════════════════════════════════════════════════════════════════ */

import { useId, useState, type ReactNode } from 'react';
import { Pressable, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import { C, HATCH_COLORS, HATCH_STRIPE } from '@stips/core';
import type { Membre } from '@stips/core';
import { F } from './tokens';

/** Micro-label mono en capitales : « NOTE GLOBALE », « DISPONIBILITÉS »… */
export function Mono({ children, color = C.muted2, size = 10, style }: {
  children: ReactNode; color?: string; size?: number; style?: StyleProp<ViewStyle>;
}) {
  return (
    <Text style={[{ fontFamily: F.monoMedium, fontSize: size, color, letterSpacing: size * 0.08 }, style]}>
      {children}
    </Text>
  );
}

/** En-tête de marque en haut de chaque écran (le vrai statut du téléphone
    — heure, réseau, batterie — est déjà rendu par l'OS ; on ne garde que
    le wordmark, contrairement à la maquette web qui devait le simuler).

    Reprend la police et le traitement de l'ancien wordmark « Le Club »
    (Instrument Serif italique) : seul le texte a changé. Le dessin du
    logo (icône d'app, écran de démarrage, une teinte par variante) est
    indépendant de cet en-tête et n'en dépend pas — voir
    `scripts/logo/generer.mjs`. */
export function AppHeader({ color = C.ink }: { color?: string }) {
  return (
    <View style={{ height: 40, flexShrink: 0, justifyContent: 'flex-end', paddingHorizontal: 22, paddingBottom: 8 }}>
      <Text style={{ fontFamily: F.serifItalic, fontSize: 20, color, letterSpacing: 0.2 }}>Stips</Text>
    </View>
  );
}

/** Titre d'écran en Instrument Serif, avec sous-titre optionnel */
export function ScreenHead({ titre, sous, right, border = true, pad = 16 }: {
  titre: string; sous?: string; right?: ReactNode; border?: boolean; pad?: number;
}) {
  return (
    <View style={{
      flexShrink: 0, paddingHorizontal: 22, paddingTop: pad, paddingBottom: 12,
      borderBottomWidth: border ? 1 : 0, borderBottomColor: 'rgba(0,0,0,.08)',
      // Avec `right`, titre et action côte à côte, alignés par le bas.
      // Sans `right`, on reste en colonne et surtout SANS alignItems :
      // en colonne l'axe transversal est horizontal, donc un
      // `alignItems:'flex-end'` y pousserait le titre à droite. (Le web
      // s'en sortait avec `display:block`, qui ignore alignItems ; en RN
      // tout est flex, il n'y a pas cette échappatoire.)
      ...(right && {
        flexDirection: 'row' as const,
        alignItems: 'flex-end' as const,
        justifyContent: 'space-between' as const,
      }),
    }}>
      <View>
        <Text style={{ fontFamily: F.serif, fontSize: 32, lineHeight: 34, color: C.ink }}>{titre}</Text>
        {sous && (
          <Text style={{ fontFamily: F.uiRegular, fontSize: 13, color: C.muted, marginTop: 4 }}>{sous}</Text>
        )}
      </View>
      {right}
    </View>
  );
}

/** Motif hachuré (avatars, pièces jointes, en attendant les photos) */
export function Hatch({ style, stripe = HATCH_STRIPE, colors = HATCH_COLORS }: {
  style?: StyleProp<ViewStyle>; stripe?: number; colors?: { a: string; b: string };
}) {
  const id = `hatch-${useId()}`;
  return (
    <View style={[{ flex: 1 }, style]}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id={id} patternUnits="userSpaceOnUse"
                   width={stripe * 2} height={stripe * 2}
                   patternTransform="rotate(45)">
            <Rect x={0} y={0} width={stripe * 2} height={stripe * 2} fill={colors.b} />
            <Rect x={0} y={0} width={stripe} height={stripe * 2} fill={colors.a} />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

/** Avatar hachuré */
export function Avatar({ size = 44 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', flexShrink: 0 }}>
      <Hatch />
    </View>
  );
}

/** Bouton contour → plein noir au press. Sert à « Écrire », « Voir », « Je viens »… */
export function Stk({ children, onPress, size = 12, padV = 8, padH = 14, style }: {
  children: ReactNode; onPress?: () => void; size?: number; padV?: number; padH?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{
      paddingVertical: padV, paddingHorizontal: padH, borderRadius: 99,
      borderWidth: 1, borderColor: pressed ? C.ink : 'rgba(0,0,0,.16)',
      backgroundColor: pressed ? C.ink : 'transparent', alignSelf: 'flex-start',
    }, style]}>
      {({ pressed }) => (
        <Text style={{ fontFamily: F.uiSemiBold, fontSize: size, color: pressed ? C.cream : C.ink }}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}

/** Pilule noire pleine, l'action principale d'un écran : « Accepter
    l'invitation », « Mettre à jour ». Contrairement à Stk (contour → plein
    au press) elle est pleine au repos — il n'y en a qu'une par écran. */
export function BoutonPlein({ children, onPress }: {
  children: ReactNode; onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={{
      padding: 15, borderRadius: 99, backgroundColor: C.ink, alignItems: 'center',
    }}>
      <Text style={{ fontFamily: F.uiSemiBold, fontSize: 15, color: C.cream }}>{children}</Text>
    </Pressable>
  );
}

/** Rangée de filtres carrés (Tous / 4.5+ / Dispo été / ⚙) */
export function Pills({ items, active, onChange, border = true }: {
  items: string[]; active: string; onChange?: (p: string) => void; border?: boolean;
}) {
  return (
    <View style={{
      flexShrink: 0, paddingHorizontal: 22, paddingVertical: 12, flexDirection: 'row', gap: 7,
      borderBottomWidth: border ? 1 : 0, borderBottomColor: C.lineFaint,
    }}>
      {items.map(p => {
        const on = p === active;
        return (
          <Pressable key={p} onPress={() => onChange && onChange(p)} style={{
            paddingVertical: 6, paddingHorizontal: 12, borderRadius: 7,
            backgroundColor: on ? C.ink : C.wash,
          }}>
            <Text style={{ fontFamily: F.uiMedium, fontSize: 12, color: on ? C.cream : C.ink4 }}>{p}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Bascule à deux états, façon segmented control (Personnes / Boîtes) */
export function Segmented({ items, active, onChange }: {
  items: string[]; active: string; onChange: (i: string) => void;
}) {
  return (
    <View style={{
      marginTop: 12, flexDirection: 'row', backgroundColor: C.wash,
      borderRadius: 10, padding: 3,
    }}>
      {items.map(i => {
        const on = i === active;
        return (
          <Pressable key={i} onPress={() => onChange(i)} style={{
            flex: 1, paddingVertical: 9, borderRadius: 8,
            backgroundColor: on ? C.ink : 'transparent', alignItems: 'center',
          }}>
            <Text style={{ fontFamily: F.uiSemiBold, fontSize: 13, color: on ? C.cream : C.ink4 }}>{i}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Champ de recherche */
export function SearchField({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const rempli = value.length > 0;
  return (
    <View style={{
      marginTop: 14, backgroundColor: C.card, borderRadius: 11,
      borderWidth: rempli ? 1.5 : 1, borderColor: rempli ? C.ink : C.fieldLine,
      paddingVertical: 13, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10,
    }}>
      <Text style={{ fontSize: 15, color: rempli ? C.ink : C.faint }}>⌕</Text>
      <TextInput
        value={value} placeholder={placeholder} onChangeText={onChange}
        placeholderTextColor={C.faint}
        style={{ flex: 1, padding: 0, fontFamily: F.uiMedium, fontSize: 14, color: C.ink }}
      />
      {rempli && (
        <Pressable onPress={() => onChange('')}>
          <Text style={{ fontSize: 15, color: C.faint }}>×</Text>
        </Pressable>
      )}
    </View>
  );
}

/** Rangée « une personne » : avatar, nom (+ badge PARRAIN), sous-titre, action */
export function PersonRow({ p, size = 44, last, onWrite }: {
  p: Membre; size?: number; last?: boolean; onWrite?: () => void;
}) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 13,
      borderBottomWidth: last ? 0 : 1, borderBottomColor: C.lineSoft,
    }}>
      <Avatar size={size} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <Text style={{ fontFamily: F.uiSemiBold, fontSize: 15, color: C.ink }}>{p.nom}</Text>
          {p.parrain && (
            <Text style={{
              paddingVertical: 2, paddingHorizontal: 7, borderRadius: 5,
              backgroundColor: C.ink, color: C.cream, fontFamily: F.monoMedium, fontSize: 9,
              overflow: 'hidden',
            }}>PARRAIN</Text>
          )}
        </View>
        <Text style={{ fontFamily: F.uiRegular, fontSize: 12, color: C.muted, marginTop: 2 }}>{p.sous}</Text>
      </View>
      <Stk onPress={onWrite}>Écrire</Stk>
    </View>
  );
}

/** Carte blanche standard */
export function Card({ children, style, dark, radius = 16, pad = 18 }: {
  children: ReactNode; style?: StyleProp<ViewStyle>; dark?: boolean; radius?: number; pad?: number;
}) {
  return (
    <View style={[{
      backgroundColor: dark ? C.ink : C.card,
      borderWidth: dark ? 0 : 1, borderColor: C.line,
      borderRadius: radius, padding: pad,
    }, style]}>{children}</View>
  );
}

/** État vide, pour les écrans pas encore dessinés */
export function Placeholder({ label, texte }: { label: string; texte: string }) {
  return (
    <View style={{ paddingHorizontal: 22, paddingTop: 18, paddingBottom: 96 }}>
      <View style={{
        height: 220, borderRadius: 16, overflow: 'hidden',
        alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24,
      }}>
        <Hatch style={{ position: 'absolute', inset: 0 }} />
        <Mono color={C.muted2}>{label}</Mono>
        <Text style={{
          fontFamily: F.uiRegular, fontSize: 13, lineHeight: 19, color: C.muted,
          maxWidth: 240, textAlign: 'center',
        }}>{texte}</Text>
      </View>
    </View>
  );
}

/** Bouton rond avec info-bulle (CV, LinkedIn, lettre de reco…). Sur le web
    l'info-bulle apparaît au survol ; ici elle apparaît tant que le doigt
    reste appuyé (pas d'équivalent :hover sur mobile). */
export function RondPiece({ children, tooltip, size = 48, fontSize = 11, fontFamily = F.monoMedium, onPress }: {
  children: ReactNode; tooltip?: string | null; size?: number; fontSize?: number;
  fontFamily?: string; onPress?: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable onPress={onPress} onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)} style={{
      width: size, height: size, borderRadius: size / 2,
      borderWidth: 1, borderColor: pressed ? C.ink : 'rgba(0,0,0,.16)',
      backgroundColor: pressed ? C.ink : 'transparent',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontFamily, fontSize, letterSpacing: fontSize * 0.04, color: pressed ? C.cream : C.ink }}>
        {children}
      </Text>
      {tooltip && pressed && (
        <View style={{
          position: 'absolute', bottom: size + 9, alignSelf: 'center',
          paddingVertical: 5, paddingHorizontal: 10, borderRadius: 5, backgroundColor: C.ink,
        }}>
          <Text style={{ fontFamily: F.uiMedium, fontSize: 11, color: C.cream }}>
            {tooltip}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

/** Coquille d'un écran : en-tête + contenu. La barre d'onglets n'est plus
    portée par l'écran lui-même — c'est React Navigation (Tab.Navigator
    dans App.tsx) qui la rend, en lisant le même `Ecran.tab` que sur le web. */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <AppHeader />
      {children}
    </View>
  );
}

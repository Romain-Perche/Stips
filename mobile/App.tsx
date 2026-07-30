/* ══════════════════════════════════════════════════════════════════════
   APP — le routeur

   Deux axes d'état, comme sur le web :
     · role     : 'candidat' | 'entreprise'  → décide de la liste d'onglets
     · horsNav  : un écran affiché seul, sans nav ('invitation' | null)
                  — c'est le seul écran qui précède la création de compte.

   Le sélecteur candidat/entreprise n'est plus une barre de dev cachée sous
   le téléphone (comme sur le web à l'origine) : c'est un bandeau visible en
   haut de l'app, tant qu'il n'y a pas deux comptes distincts (voir "À
   trancher" dans la description du projet).

   La liste d'onglets par rôle reste la SEULE source de vérité pour la nav :
   chaque écran porte son propre `.tab = { id, label }`, lu directement par
   le Tab.Navigator ci-dessous — jamais retapé.
   ══════════════════════════════════════════════════════════════════════ */

import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, type ParamListBase } from '@react-navigation/native';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif';
import { Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold } from '@expo-google-fonts/outfit';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';

import { C } from '@leclub/core';
import type { Role } from '@leclub/core';
import { F } from './src/tokens';
import ScreenChercher from './src/screens/ScreenChercher';
import ScreenStagesCandidat from './src/screens/ScreenStagesCandidat';
import ScreenEvents from './src/screens/ScreenEvents';
import ScreenForum from './src/screens/ScreenForum';
import ScreenProfil from './src/screens/ScreenProfil';
import ScreenTalents from './src/screens/ScreenTalents';
import ScreenOffres from './src/screens/ScreenOffres';
import ScreenInvitation from './src/screens/ScreenInvitation';
import type { TabScreen } from './src/types';

const TABS: Record<Role, TabScreen[]> = {
  candidat: [ScreenChercher, ScreenStagesCandidat, ScreenEvents, ScreenForum, ScreenProfil],
  // Vue entreprise volontairement restreinte : la recherche de candidats
  // potentiels (Talents) et la gestion des offres. Pas d'Agenda ni de
  // Forum côté entreprise pour l'instant.
  entreprise: [ScreenTalents, ScreenOffres],
};

const Tab = createBottomTabNavigator<ParamListBase>();

/** Barre d'onglets : ne connaît aucun nom d'onglet en dur, elle lit
    `options.title` (posé sur chaque <Tab.Screen> à partir de `Ecran.tab`). */
function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{
      flexDirection: 'row', backgroundColor: C.card,
      borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,.09)',
      paddingTop: 12, paddingBottom: insets.bottom || 12,
    }}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = typeof options.title === 'string' ? options.title : route.name;
        const on = state.index === index;
        return (
          <Pressable key={route.key} onPress={() => navigation.navigate(route.name)}
            style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontFamily: F.uiMedium, fontSize: 13, color: on ? C.ink : C.faint }}>
              {on ? '◈' : '◇'}
            </Text>
            <Text style={{ fontFamily: F.uiMedium, fontSize: 11, color: on ? C.ink : C.faint, marginTop: 3 }}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Tabs({ role }: { role: Role }) {
  const screens = TABS[role];
  return (
    <Tab.Navigator
      initialRouteName={screens[0].tab.id}
      screenOptions={{ headerShown: false }}
      tabBar={props => <AppTabBar {...props} />}
    >
      {screens.map(Ecran => (
        <Tab.Screen key={Ecran.tab.id} name={Ecran.tab.id} component={Ecran}
          options={{ title: Ecran.tab.label }} />
      ))}
    </Tab.Navigator>
  );
}

/** Le choix candidat / entreprise : bandeau plein, en haut de l'app,
    toujours visible. Provisoire tant que le compte entreprise n'est pas
    distinct du compte candidat (voir "À trancher" §2). */
function RoleSwitcher({ role, onChange }: { role: Role; onChange: (r: Role) => void }) {
  return (
    <View style={{ backgroundColor: C.ink, paddingTop: 14, paddingBottom: 10, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,.12)', borderRadius: 14, padding: 4 }}>
        {(['candidat', 'entreprise'] as const).map(r => {
          const on = r === role;
          return (
            <Pressable key={r} onPress={() => onChange(r)} style={{
              flex: 1, paddingVertical: 15, borderRadius: 11,
              backgroundColor: on ? C.cream : 'transparent', alignItems: 'center',
            }}>
              <Text style={{
                fontFamily: F.uiSemiBold, fontSize: 15, letterSpacing: 0.6,
                color: on ? C.ink : C.creamMut,
              }}>{r === 'candidat' ? 'CANDIDAT' : 'ENTREPRISE'}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic,
    Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold,
    JetBrainsMono_500Medium,
  });
  const [role, setRole] = useState<Role>('candidat');
  const [horsNav, setHorsNav] = useState<'invitation' | null>('invitation');

  if (!fontsLoaded) return null;

  const changerRole = (r: Role) => { setRole(r); setHorsNav(null); };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* edges=['top'] une seule fois ici : l'encoche/le statut est déjà
            évité pour tout ce qui suit (RoleSwitcher, ScreenInvitation) —
            les écrans eux-mêmes (atoms.tsx → Screen) n'ont pas à y repenser. */}
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: horsNav === 'invitation' ? C.bg : C.ink }}>
          {horsNav === 'invitation' ? (
            <ScreenInvitation onAccepter={() => setHorsNav(null)} />
          ) : (
            <View style={{ flex: 1, backgroundColor: C.bg }}>
              <RoleSwitcher role={role} onChange={changerRole} />
              <NavigationContainer>
                <Tabs role={role} key={role} />
              </NavigationContainer>
            </View>
          )}
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

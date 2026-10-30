/**
 * useFamilyRoom — le contexte commun des écrans Famille.
 *
 * Les écrans `m*` du kit ont tous besoin de la même chose : la famille active,
 * ses membres, et le nom du profil en cours (pour savoir « qui je suis » dans
 * une séance ou un défi). Ce hook le charge **une fois**, avec les mêmes
 * garde-fous que `app/family/members.tsx` :
 *
 *  - hors session, on ne tente rien (aucun appel réseau inutile) ;
 *  - une erreur de chargement des membres n'efface pas la famille : elle est
 *    rendue à l'écran, avec un bouton de reprise côté écran ;
 *  - les noms sont les noms d'affichage des profils — jamais des identifiants
 *    techniques, jamais des noms inventés.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { useFamilyService } from '@/hooks/useFamilyService';
import { useAuthStore } from '@/store/auth-store';
import { useFamilySyncStore } from '@/store/family-sync-store';
import type { MemberWithProfile } from '@/services/family-service';
import type { Family } from '@/domains/family';

export interface FamilyMemberView {
  accountId: string;
  name: string;
  role: MemberWithProfile['role'];
  /** `true` si le membre a un profil exploitable (sinon il est listé mais grisé). */
  hasProfile: boolean;
}

export interface FamilyRoomContext {
  family: Family | null;
  familyId: string | null;
  members: FamilyMemberView[];
  /** Nom du profil actif — « moi » dans les écrans de séance. */
  me: string;
  loading: boolean;
  error: string | null;
  reload: () => void;
  /** Vrai quand l'utilisateur n'est pas connecté : les écrans familiaux l'expliquent. */
  signedOut: boolean;
}

export function useFamilyRoom(): FamilyRoomContext {
  const families = useFamilySyncStore((s) => s.families);
  const activeFamilyId = useFamilySyncStore((s) => s.activeFamilyId);
  const { activeProfile } = useActiveProfile();
  const { getMembersScoped } = useFamilyService();
  const userId = useAuthStore((s) => s.user?.userId ?? null);

  const family = useMemo(
    () => families.find((f) => f.id === activeFamilyId) ?? null,
    [families, activeFamilyId],
  );

  const [members, setMembers] = useState<FamilyMemberView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    if (!family || !userId) {
      setMembers([]);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    getMembersScoped(family.id)
      .then((rows) => {
        if (cancelled) return;
        setMembers(
          rows.map((row) => ({
            accountId: row.accountId,
            name: row.profile?.displayName?.trim() || row.accountId,
            role: row.role,
            hasProfile: Boolean(row.profile),
          })),
        );
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        setMembers([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [family, userId, getMembersScoped, tick]);

  const me = activeProfile?.displayName?.trim() || members[0]?.name || '';

  return {
    family,
    familyId: family?.id ?? null,
    members,
    me,
    loading,
    error,
    reload,
    signedOut: !userId,
  };
}

/**
 * Semantic Query Hook — UI glue for the semantic tree views
 *
 * Bridges the application-layer {@link SemanticService} (which wraps the
 * pure domain `SemanticQueryService`) to React. Cancellation-safe fetch,
 * loading/not-found state — no business logic.
 */

import { useEffect, useRef, useState } from 'react';
import type { Community, RecallCues } from '@/domains/semantic-memory';
import type {
  CommunityViewData,
  ConceptViewData,
  ConceptWithVerses,
  MyConceptEntry,
} from '@/services/semantic-query-service';
import { getSemanticService } from '@/services/semantic-query-service';

export interface SemanticIndexData {
  communities: Community[];
  featuredConcepts: ConceptWithVerses[];
}

// ------------------------------------------------------------------
// Concept view
// ------------------------------------------------------------------

export function useConceptView(conceptId: string | undefined): {
  data: ConceptViewData | null;
  loading: boolean;
  notFound: boolean;
} {
  const [data, setData] = useState<ConceptViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const reqRef = useRef(0);

  useEffect(() => {
    const req = ++reqRef.current;
    if (!conceptId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotFound(false);

    getSemanticService()
      .conceptView(conceptId)
      .then((result) => {
        if (req !== reqRef.current) return;
        if (!result) setNotFound(true);
        setData(result);
      })
      .catch(() => {
        if (req !== reqRef.current) return;
        setNotFound(true);
        setData(null);
      })
      .finally(() => {
        if (req === reqRef.current) setLoading(false);
      });

    return () => {
      reqRef.current++;
    };
  }, [conceptId]);

  return { data, loading, notFound };
}
// ------------------------------------------------------------------
// Verse view
// ------------------------------------------------------------------

export function useVerseView(verseKey: string | undefined): {
  cues: RecallCues | null;
  loading: boolean;
} {
  const [cues, setCues] = useState<RecallCues | null>(null);
  const [loading, setLoading] = useState(true);
  const reqRef = useRef(0);

  useEffect(() => {
    const req = ++reqRef.current;
    if (!verseKey) {
      setLoading(false);
      return;
    }
    setLoading(true);

    getSemanticService()
      .verseView(verseKey)
      .then((result) => {
        if (req === reqRef.current) setCues(result);
      })
      .catch(() => {
        if (req === reqRef.current) setCues(null);
      })
      .finally(() => {
        if (req === reqRef.current) setLoading(false);
      });

    return () => {
      reqRef.current++;
    };
  }, [verseKey]);

  return { cues, loading };
}

// ------------------------------------------------------------------
// Community view
// ------------------------------------------------------------------

export function useCommunityView(communityId: string | undefined): {
  data: CommunityViewData | null;
  loading: boolean;
  notFound: boolean;
} {
  const [data, setData] = useState<CommunityViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const reqRef = useRef(0);

  useEffect(() => {
    const req = ++reqRef.current;
    if (!communityId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotFound(false);

    getSemanticService()
      .communityView(communityId)
      .then((result) => {
        if (req !== reqRef.current) return;
        if (!result) setNotFound(true);
        setData(result);
      })
      .catch(() => {
        if (req !== reqRef.current) return;
        setNotFound(true);
        setData(null);
      })
      .finally(() => {
        if (req === reqRef.current) setLoading(false);
      });

    return () => {
      reqRef.current++;
    };
  }, [communityId]);

  return { data, loading, notFound };
}

// ------------------------------------------------------------------
// Semantic index
// ------------------------------------------------------------------

export function useSemanticIndex(): {
  data: SemanticIndexData | null;
  loading: boolean;
} {
  const [data, setData] = useState<SemanticIndexData | null>(null);
  const [loading, setLoading] = useState(true);
  const reqRef = useRef(0);

  useEffect(() => {
    const req = ++reqRef.current;
    setLoading(true);

    getSemanticService()
      .indexView()
      .then((result) => {
        if (req !== reqRef.current) return;
        setData(result);
      })
      .catch(() => {
        if (req !== reqRef.current) return;
        setData({ communities: [], featuredConcepts: [] });
      })
      .finally(() => {
        if (req === reqRef.current) setLoading(false);
      });

    return () => {
      reqRef.current++;
    };
  }, []);

  return { data, loading };
}

// ------------------------------------------------------------------
// User's personal semantic tree (concepts created via "Taguer")
// ------------------------------------------------------------------

export { MyConceptEntry } from '@/services/semantic-query-service';

export function useMyConcepts(limit = 40): {
  entries: MyConceptEntry[];
  loading: boolean;
  /** Bump to re-fetch (e.g. after a tag is saved). */
  refreshKey: number;
  refresh: () => void;
} {
  const [entries, setEntries] = useState<MyConceptEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const reqRef = useRef(0);

  useEffect(() => {
    const req = ++reqRef.current;
    setLoading(true);
    getSemanticService()
      .myConcepts(limit)
      .then((result) => {
        if (req !== reqRef.current) return;
        setEntries(result as MyConceptEntry[]);
      })
      .catch(() => {
        if (req !== reqRef.current) return;
        setEntries([]);
      })
      .finally(() => {
        if (req === reqRef.current) setLoading(false);
      });

    return () => {
      reqRef.current++;
    };
  }, [limit, refreshKey]);

  return {
    entries,
    loading,
    refreshKey,
    refresh: () => setRefreshKey((k) => k + 1),
  };
}

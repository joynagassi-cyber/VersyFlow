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

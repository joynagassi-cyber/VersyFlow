/**
 * Ionic Navigation Hook
 *
 * Provides useRouter-compatible API for React Router DOM.
 */

import { useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';

interface Router {
  push: (path: string | { pathname: string; params?: Record<string, string> }) => void;
  replace: (path: string | { pathname: string; params?: Record<string, string> }) => void;
  back: () => void;
  dismiss: () => void;
}

export function useRouter(): Router {
  const navigate = useNavigate();
  const location = useLocation();

  const push = (path: string | { pathname: string; params?: Record<string, string> }) => {
    if (typeof path === 'string') {
      navigate(path, { state: { from: location.pathname } });
    } else {
      const searchParams = new URLSearchParams();
      if (path.params) {
        Object.entries(path.params).forEach(([k, v]) => searchParams.set(k, v));
      }
      const queryString = searchParams.toString();
      navigate(`${path.pathname}${queryString ? `?${queryString}` : ''}`);
    }
  };

  const replace = (path: string | { pathname: string; params?: Record<string, string> }) => {
    if (typeof path === 'string') {
      navigate(path, { replace: true });
    } else {
      const searchParams = new URLSearchParams();
      if (path.params) {
        Object.entries(path.params).forEach(([k, v]) => searchParams.set(k, v));
      }
      const queryString = searchParams.toString();
      navigate(`${path.pathname}${queryString ? `?${queryString}` : ''}`, { replace: true });
    }
  };

  const back = () => navigate(-1);
  const dismiss = () => navigate(-1);

  return { push, replace, back, dismiss };
}

export function useLocalSearchParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>(): T {
  const [searchParams] = useSearchParams();
  const params = useParams();
  const result: Record<string, string | undefined> = { ...params };
  searchParams.forEach((value, key) => { result[key] = value; });
  return result as T;
}

export function useRoute() {
  const location = useLocation();
  const params = useParams();
  return { pathname: location.pathname, search: location.search, params };
}

export default useRouter;

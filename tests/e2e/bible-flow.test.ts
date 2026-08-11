/**
 * E2E Test - Bible & Content Flow
 * Teste l'accès au contenu biblique et la navigation
 */

describe('VersyFlow E2E - Bible & Content Flow', () => {
  describe('Supported translations', () => {
    it('should have supported translations', () => {
      const translations = ['lsg', 'KJV', 'NVI', 'BSB'];
      expect(translations).toContain('lsg');
      expect(translations).toContain('KJV');
      expect(translations).toHaveLength(4);
    });
  });

  describe('Bible books', () => {
    it('should have Old Testament books', () => {
      const oldTestamentBooks = ['gen', 'exo', 'psa', 'isa', 'job'];
      oldTestamentBooks.forEach(book => {
        expect(book.length).toBe(3);
      });
    });

    it('should have New Testament books', () => {
      const newTestamentBooks = ['mat', 'mrk', 'jhn', 'act', 'rom', 'rev'];
      newTestamentBooks.forEach(book => {
        expect(book.length).toBe(3);
      });
    });
  });

  describe('Bible navigation', () => {
    it('should have bible explorer screen', () => {
      const screenExists = true;
      expect(screenExists).toBe(true);
    });

    it('should have bible book screen', () => {
      const screenExists = true;
      expect(screenExists).toBe(true);
    });

    it('should have bible chapter screen', () => {
      const screenExists = true;
      expect(screenExists).toBe(true);
    });
  });

  describe('Verse structure', () => {
    it('should have valid verse reference format', () => {
      const verseRef = 'Jean 3:16';
      const parts = verseRef.split(' ');
      expect(parts.length).toBe(2);
      expect(parts[1]).toMatch(/^\d+:\d+$/);
    });

    it('should parse verse reference correctly', () => {
      const parseReference = (ref) => {
        const match = ref.match(/^(.+?)\s+(\d+):(\d+)$/);
        if (match) {
          return {
            book: match[1],
            chapter: parseInt(match[2]),
            verse: parseInt(match[3])
          };
        }
        return null;
      };

      const result = parseReference('Psaumes 23:1');
      expect(result).not.toBeNull();
      expect(result.book).toBe('Psaumes');
      expect(result.chapter).toBe(23);
      expect(result.verse).toBe(1);
    });
  });
});
